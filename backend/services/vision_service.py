import cv2
import torch
import numpy as np
import time
import json
import asyncio
from pathlib import Path
from typing import List, Dict, Tuple, Any, Optional
from dataclasses import dataclass, field
from collections import deque
from scipy.optimize import linear_sum_assignment

# ==================== Configurations and Constants ====================
CONFIG = {
    "models": {
        "yolov8": {
            "name": "YOLOv8n",
            "source": "ultralytics/yolov8n.pt",
            "type": "ultralytics",
            "expected_fps": 85,
            "expected_map": 37.3,
            "params": 3.2,
            "gflops": 8.7
        },
        "yolov9": {
            "name": "YOLOv9-c",
            "source": "WongKinYiu/yolov9",
            "type": "huggingface",
            "expected_fps": 45,
            "expected_map": 46.8,
            "params": 25.5,
            "gflops": 102.2
        },
        "yolov11": {
            "name": "YOLOv11n",
            "source": "ultralytics/yolov11n.pt", 
            "type": "ultralytics",
            "expected_fps": 90,
            "expected_map": 38.9,
            "params": 2.8,
            "gflops": 7.9
        },
        "rf-detr": {
            "name": "RF-DETR",
            "source": "Rf-Detr/RF-DETR",
            "type": "huggingface",
            "expected_fps": 32,
            "expected_map": 52.1,
            "params": 45.2,
            "gflops": 187.5
        },
        "yolov12": {
            "name": "YOLOv12n",
            "source": "ultralytics/yolov12n.pt",
            "type": "ultralytics",
            "expected_fps": 88,
            "expected_map": 40.2,
            "params": 3.1,
            "gflops": 8.2
        }
    },
    "tracking": {
        "max_age": 30,
        "min_hits": 3,
        "iou_threshold": 0.3,
        "kalman_noise": 0.03
    },
    "trajectory": {
        "prediction_horizon": 30,
        "history_length": 20,
        "num_modes": 3,
        "confidence_threshold": 0.1
    }
}

# ==================== Data Class Definitions ====================
@dataclass
class Detection:
    bbox: List[float]  # [x1, y1, x2, y2]
    confidence: float
    class_id: int
    class_name: str = "vehicle"
    
    def center(self) -> Tuple[float, float]:
        return ((self.bbox[0] + self.bbox[2]) / 2, (self.bbox[1] + self.bbox[3]) / 2)

@dataclass
class ModelPerformance:
    model_name: str
    inference_times: List[float] = field(default_factory=list)
    detection_counts: List[int] = field(default_factory=list)
    ade_scores: List[float] = field(default_factory=list)
    fde_scores: List[float] = field(default_factory=list)
    
    def compute_metrics(self) -> Dict[str, float]:
        return {
            "fps": 1.0 / np.mean(self.inference_times) if self.inference_times else 0,
            "avg_inference_time_ms": np.mean(self.inference_times) * 1000 if self.inference_times else 0,
            "avg_detections": np.mean(self.detection_counts) if self.detection_counts else 0,
            "avg_ade": np.mean(self.ade_scores) if self.ade_scores else 0,
            "avg_fde": np.mean(self.fde_scores) if self.fde_scores else 0
        }

# ==================== Kalman Filter ====================
class EnhancedKalmanFilter:
    def __init__(self, dt: float = 0.1, std_acc: float = 1.0, std_meas: float = 0.1):
        self.dt = dt
        self.n = 6
        self.m = 2
        self.F = np.array([
            [1, 0, dt, 0, 0.5*dt**2, 0],
            [0, 1, 0, dt, 0, 0.5*dt**2],
            [0, 0, 1, 0, dt, 0],
            [0, 0, 0, 1, 0, dt],
            [0, 0, 0, 0, 1, 0],
            [0, 0, 0, 0, 0, 1]
        ])
        self.H = np.array([[1, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0]])
        self.Q = np.eye(self.n)
        for i in range(2): self.Q[4+i, 4+i] = std_acc**2
        self.R = std_meas**2 * np.eye(self.m)
        self.P = np.eye(self.n)
        self.x = np.zeros((self.n, 1))
        
    def predict(self):
        self.x = self.F @ self.x
        self.P = self.F @ self.P @ self.F.T + self.Q
        return self.x[:2].flatten()
    
    def update(self, z):
        z = np.array(z).reshape(2, 1)
        S = self.H @ self.P @ self.H.T + self.R
        K = self.P @ self.H.T @ np.linalg.inv(S)
        y = z - self.H @ self.x
        self.x = self.x + K @ y
        self.P = (np.eye(self.n) - K @ self.H) @ self.P
        return self.x[:2].flatten()

# ==================== Multi-object Tracker ====================
class MultiObjectTracker:
    def __init__(self, max_age: int = 30, min_hits: int = 3, iou_threshold: float = 0.3):
        self.max_age = max_age
        self.min_hits = min_hits
        self.iou_threshold = iou_threshold
        self.trackers = []
        self.next_id = 0
        
    def update(self, detections: List[Detection]) -> List[Tuple[int, Detection]]:
        for tracker in self.trackers:
            tracker['kf'].predict()
            tracker['age'] += 1
            tracker['consecutive_invisible_count'] += 1
            
        matched, unmatched_dets, _ = self._match(detections)
        
        for trk_idx, det_idx in matched:
            tracker = self.trackers[trk_idx]
            det = detections[det_idx]
            tracker['kf'].update(det.center())
            tracker['consecutive_invisible_count'] = 0
            tracker['total_visible_count'] += 1
            tracker['positions'].append(det.center())
            tracker['detections'].append(det)
            if len(tracker['positions']) > 1:
                p1, p2 = tracker['positions'][-2:]
                tracker['velocities'].append((p2[0]-p1[0], p2[1]-p1[1]))
            
        for det_idx in unmatched_dets:
            self._create_tracker(detections[det_idx])
            
        self.trackers = [t for t in self.trackers if t['consecutive_invisible_count'] <= self.max_age]
        
        return [(t['id'], t['detections'][-1]) for t in self.trackers if t['total_visible_count'] >= self.min_hits]
    
    def _match(self, detections: List[Detection]):
        if not self.trackers or not detections: return [], list(range(len(detections))), []
        iou_matrix = np.zeros((len(self.trackers), len(detections)))
        for i, trk in enumerate(self.trackers):
            for j, det in enumerate(detections):
                if trk['detections']:
                    iou_matrix[i, j] = self._compute_iou(trk['detections'][-1].bbox, det.bbox)
        
        row_ind, col_ind = linear_sum_assignment(1 - iou_matrix)
        matched = [(i, j) for i, j in zip(row_ind, col_ind) if iou_matrix[i, j] >= self.iou_threshold]
        unmatched_dets = [j for j in range(len(detections)) if j not in [m[1] for m in matched]]
        unmatched_trks = [i for i in range(len(self.trackers)) if i not in [m[0] for m in matched]]
        return matched, unmatched_dets, unmatched_trks

    def _create_tracker(self, detection: Detection):
        tracker = {
            'id': self.next_id, 'kf': EnhancedKalmanFilter(), 'positions': [detection.center()],
            'velocities': [], 'detections': [detection], 'age': 0,
            'total_visible_count': 1, 'consecutive_invisible_count': 0
        }
        tracker['kf'].x[:2] = np.array(detection.center()).reshape(2, 1)
        self.trackers.append(tracker); self.next_id += 1

    def _compute_iou(self, b1, b2):
        x1, y1 = max(b1[0], b2[0]), max(b1[1], b2[1])
        x2, y2 = min(b1[2], b2[2]), min(b1[3], b2[3])
        if x2 <= x1 or y2 <= y1: return 0.0
        inter = (x2 - x1) * (y2 - y1)
        area1 = (b1[2]-b1[0])*(b1[3]-b1[1]); area2 = (b2[2]-b2[0])*(b2[3]-b2[1])
        return inter / (area1 + area2 - inter)

# ==================== Trajectory Predictor ====================
class TrajectoryPredictor:
    def __init__(self, prediction_horizon: int = 30, num_modes: int = 3):
        self.prediction_horizon = prediction_horizon
        self.num_modes = num_modes
        
    def predict(self, positions, velocities):
        if len(positions) < 2: return [[] for _ in range(self.num_modes)], [1.0/self.num_modes]*self.num_modes
        last_pos = positions[-1]
        v = np.mean(velocities[-5:], axis=0) if velocities else (0,0)
        trajs, confs = [], [0.6, 0.25, 0.15]
        for angle in [0, 0.1, -0.1]:
            t = []
            for i in range(1, self.prediction_horizon+1):
                s = i * 0.3
                x = last_pos[0] + (v[0]*np.cos(angle) - v[1]*np.sin(angle)) * s
                y = last_pos[1] + (v[0]*np.sin(angle) + v[1]*np.cos(angle)) * s
                t.append((float(x), float(y)))
            trajs.append(t)
        return trajs, confs

# ==================== Vision Service Engine ====================
class VisionService:
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.models = {}
        
    def _get_model(self, model_key: str):
        if model_key in self.models: return self.models[model_key]
        # In actual deployment, we would load the models here. 
        # For this implementation, we will mock the detection based on the model type.
        return None

    async def stream_video(self, video_path: str, model_keys: List[str], confidence: float = 0.5):
        cap = cv2.VideoCapture(video_path)
        
        engines = {key: {
            'tracker': MultiObjectTracker(),
            'predictor': TrajectoryPredictor(),
            'performance': ModelPerformance(model_name=key)
        } for key in model_keys}
        
        frame_id = 0
        try:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret: break
                
                start_full = time.time()
                frame_data = {'id': frame_id, 'layers': {}}
                
                for key in model_keys:
                    start = time.time()
                    detections = self._mock_detect(frame, key, confidence)
                    tracked = engines[key]['tracker'].update(detections)
                    
                    preds = {}
                    for tid, det in tracked:
                        trk = next(t for t in engines[key]['tracker'].trackers if t['id'] == tid)
                        trajs, confs = engines[key]['predictor'].predict(trk['positions'], trk['velocities'])
                        preds[tid] = {'trajectories': trajs, 'confidences': confs}
                    
                    inf_time = time.time() - start
                    engines[key]['performance'].inference_times.append(inf_time)
                    engines[key]['performance'].detection_counts.append(len(detections))
                    
                    frame_data['layers'][key] = {
                        'detections': [d.__dict__ for d in detections],
                        'tracked': [{'id': tid, 'bbox': d.bbox} for tid, d in tracked],
                        'predictions': preds,
                        'metrics': engines[key]['performance'].compute_metrics()
                    }
                
                # Encode frame
                _, buffer = cv2.imencode('.jpg', frame)
                frame_bytes = buffer.tobytes()
                
                # Global metrics
                frame_data['processing_time'] = (time.time() - start_full) * 1000
                
                # Multipart boundary
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n'
                       b'X-Telemetry: ' + json.dumps(frame_data).encode() + b'\r\n')
                
                frame_id += 1
                # Slow down stream for demo visibility if needed
                await asyncio.sleep(0.01)
                
        finally:
            cap.release()

    def _mock_detect(self, frame, model_key, confidence):
        # Generate some realistic-looking detections for the demo
        h, w = frame.shape[:2]
        num_dets = np.random.randint(2, 6)
        dets = []
        for i in range(num_dets):
            # Simulate object movement based on model type (mock)
            x = np.random.randint(w//4, 3*w//4)
            y = np.random.randint(h//2, h-50)
            bw, bh = np.random.randint(40, 100), np.random.randint(30, 60)
            dets.append(Detection(
                bbox=[float(x-bw//2), float(y-bh//2), float(x+bw//2), float(y+bh//2)],
                confidence=float(0.7 + np.random.random()*0.2),
                class_id=2, class_name="car"
            ))
        return dets
