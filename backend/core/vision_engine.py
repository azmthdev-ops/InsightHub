# core/vision_engine.py
"""
Vision Engine - Object detection, tracking, and trajectory prediction.
Supports multiple YOLO variants (v8, v9, v11, v12) and RF-DETR.
"""

import numpy as np
import cv2
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, field
from collections import deque
import time
from abc import ABC, abstractmethod

# Try to import optional dependencies
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    print("⚠️ ultralytics not installed. Install with: pip install ultralytics")

try:
    from scipy.optimize import linear_sum_assignment
    from scipy.spatial.distance import cdist
    SCIPY_AVAILABLE = True
except ImportError:
    SCIPY_AVAILABLE = False
    print("⚠️ scipy not installed. Install with: pip install scipy")


# ==================== Data Classes ====================

@dataclass
class Detection:
    """Represents a single object detection."""
    bbox: Tuple[float, float, float, float]  # x1, y1, x2, y2
    confidence: float
    class_id: int
    class_name: str
    
    @property
    def center(self) -> Tuple[float, float]:
        x1, y1, x2, y2 = self.bbox
        return ((x1 + x2) / 2, (y1 + y2) / 2)
    
    @property
    def area(self) -> float:
        x1, y1, x2, y2 = self.bbox
        return (x2 - x1) * (y2 - y1)


@dataclass
class Track:
    """Represents a tracked object over time."""
    track_id: int
    detections: List[Detection] = field(default_factory=list)
    trajectory: List[Tuple[float, float]] = field(default_factory=list)
    predicted_trajectory: List[Tuple[float, float]] = field(default_factory=list)
    age: int = 0
    hits: int = 0
    time_since_update: int = 0
    state: np.ndarray = None
    
    def add_detection(self, detection: Detection):
        self.detections.append(detection)
        self.trajectory.append(detection.center)
        self.hits += 1
        self.time_since_update = 0


# ==================== Enhanced Kalman Filter ====================

class EnhancedKalmanFilter:
    """
    Enhanced Kalman Filter for smooth motion tracking.
    State vector: [x, y, vx, vy, ax, ay] (position, velocity, acceleration)
    """
    
    def __init__(self, initial_state: np.ndarray = None):
        # State dimension: x, y, vx, vy, ax, ay
        self.dim_x = 6
        # Measurement dimension: x, y
        self.dim_z = 2
        
        # State vector
        if initial_state is not None:
            self.x = np.zeros((self.dim_x, 1))
            self.x[0, 0] = initial_state[0]  # x
            self.x[1, 0] = initial_state[1]  # y
        else:
            self.x = np.zeros((self.dim_x, 1))
        
        # State transition matrix (constant acceleration model)
        dt = 1.0  # Time step
        self.F = np.array([
            [1, 0, dt, 0, 0.5*dt**2, 0],
            [0, 1, 0, dt, 0, 0.5*dt**2],
            [0, 0, 1, 0, dt, 0],
            [0, 0, 0, 1, 0, dt],
            [0, 0, 0, 0, 1, 0],
            [0, 0, 0, 0, 0, 1]
        ])
        
        # Measurement matrix
        self.H = np.array([
            [1, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0]
        ])
        
        # Process noise covariance
        q = 0.1
        self.Q = np.eye(self.dim_x) * q
        
        # Measurement noise covariance
        r = 1.0
        self.R = np.eye(self.dim_z) * r
        
        # State covariance matrix
        self.P = np.eye(self.dim_x) * 100
        
        # Identity matrix
        self.I = np.eye(self.dim_x)
    
    def predict(self) -> np.ndarray:
        """Predict the next state."""
        self.x = self.F @ self.x
        self.P = self.F @ self.P @ self.F.T + self.Q
        return self.x[:2].flatten()
    
    def update(self, measurement: np.ndarray) -> np.ndarray:
        """Update state with new measurement."""
        z = measurement.reshape((self.dim_z, 1))
        
        # Innovation
        y = z - self.H @ self.x
        
        # Innovation covariance
        S = self.H @ self.P @ self.H.T + self.R
        
        # Kalman gain
        K = self.P @ self.H.T @ np.linalg.inv(S)
        
        # Update state
        self.x = self.x + K @ y
        
        # Update covariance
        self.P = (self.I - K @ self.H) @ self.P
        
        return self.x[:2].flatten()
    
    def get_state(self) -> np.ndarray:
        """Get current state estimate."""
        return self.x.flatten()
    
    def get_velocity(self) -> Tuple[float, float]:
        """Get current velocity estimate."""
        return (self.x[2, 0], self.x[3, 0])


# ==================== Multi-Object Tracker ====================

class MultiObjectTracker:
    """
    ByteTrack-style multi-object tracker using Hungarian algorithm.
    """
    
    def __init__(self, max_age: int = 30, min_hits: int = 3, iou_threshold: float = 0.3):
        self.max_age = max_age
        self.min_hits = min_hits
        self.iou_threshold = iou_threshold
        self.tracks: Dict[int, Track] = {}
        self.kalman_filters: Dict[int, EnhancedKalmanFilter] = {}
        self.next_id = 1
        self.frame_count = 0
    
    def _iou(self, bbox1: Tuple, bbox2: Tuple) -> float:
        """Calculate IoU between two bounding boxes."""
        x1 = max(bbox1[0], bbox2[0])
        y1 = max(bbox1[1], bbox2[1])
        x2 = min(bbox1[2], bbox2[2])
        y2 = min(bbox1[3], bbox2[3])
        
        inter_area = max(0, x2 - x1) * max(0, y2 - y1)
        
        area1 = (bbox1[2] - bbox1[0]) * (bbox1[3] - bbox1[1])
        area2 = (bbox2[2] - bbox2[0]) * (bbox2[3] - bbox2[1])
        
        union_area = area1 + area2 - inter_area
        
        return inter_area / union_area if union_area > 0 else 0
    
    def _compute_iou_matrix(self, detections: List[Detection], tracks: List[Track]) -> np.ndarray:
        """Compute IoU matrix between detections and tracks."""
        if not detections or not tracks:
            return np.array([])
        
        iou_matrix = np.zeros((len(detections), len(tracks)))
        
        for i, det in enumerate(detections):
            for j, track in enumerate(tracks):
                if track.detections:
                    last_bbox = track.detections[-1].bbox
                    iou_matrix[i, j] = self._iou(det.bbox, last_bbox)
        
        return iou_matrix
    
    def update(self, detections: List[Detection]) -> Dict[int, Track]:
        """Update tracks with new detections."""
        self.frame_count += 1
        
        # Predict new locations for existing tracks
        for track_id, kf in self.kalman_filters.items():
            kf.predict()
        
        # Get active tracks
        active_tracks = [t for t in self.tracks.values() if t.time_since_update < self.max_age]
        
        if not detections:
            # No detections - increment time since update
            for track in self.tracks.values():
                track.time_since_update += 1
            return self.tracks
        
        if not active_tracks:
            # No existing tracks - create new ones
            for det in detections:
                self._create_track(det)
            return self.tracks
        
        # Compute IoU matrix
        iou_matrix = self._compute_iou_matrix(detections, active_tracks)
        
        if iou_matrix.size > 0 and SCIPY_AVAILABLE:
            # Hungarian algorithm for optimal assignment
            cost_matrix = 1 - iou_matrix
            row_indices, col_indices = linear_sum_assignment(cost_matrix)
            
            matched_detections = set()
            matched_tracks = set()
            
            for row, col in zip(row_indices, col_indices):
                if iou_matrix[row, col] >= self.iou_threshold:
                    det = detections[row]
                    track = active_tracks[col]
                    
                    # Update track
                    track.add_detection(det)
                    track.age += 1
                    
                    # Update Kalman filter
                    if track.track_id in self.kalman_filters:
                        self.kalman_filters[track.track_id].update(np.array(det.center))
                    
                    matched_detections.add(row)
                    matched_tracks.add(col)
            
            # Create new tracks for unmatched detections
            for i, det in enumerate(detections):
                if i not in matched_detections:
                    self._create_track(det)
            
            # Increment time since update for unmatched tracks
            for j, track in enumerate(active_tracks):
                if j not in matched_tracks:
                    track.time_since_update += 1
        else:
            # Simple nearest neighbor matching (fallback)
            for det in detections:
                best_track = None
                best_iou = self.iou_threshold
                
                for track in active_tracks:
                    if track.detections:
                        iou = self._iou(det.bbox, track.detections[-1].bbox)
                        if iou > best_iou:
                            best_iou = iou
                            best_track = track
                
                if best_track:
                    best_track.add_detection(det)
                    best_track.age += 1
                    if best_track.track_id in self.kalman_filters:
                        self.kalman_filters[best_track.track_id].update(np.array(det.center))
                else:
                    self._create_track(det)
        
        # Remove old tracks
        self._remove_old_tracks()
        
        return self.tracks
    
    def _create_track(self, detection: Detection) -> Track:
        """Create a new track from a detection."""
        track = Track(track_id=self.next_id)
        track.add_detection(detection)
        
        # Initialize Kalman filter
        kf = EnhancedKalmanFilter(np.array(detection.center))
        self.kalman_filters[self.next_id] = kf
        
        self.tracks[self.next_id] = track
        self.next_id += 1
        
        return track
    
    def _remove_old_tracks(self):
        """Remove tracks that haven't been updated recently."""
        to_remove = [
            track_id for track_id, track in self.tracks.items()
            if track.time_since_update > self.max_age
        ]
        
        for track_id in to_remove:
            del self.tracks[track_id]
            if track_id in self.kalman_filters:
                del self.kalman_filters[track_id]
    
    def get_confirmed_tracks(self) -> List[Track]:
        """Get tracks that have been confirmed (enough hits)."""
        return [
            track for track in self.tracks.values()
            if track.hits >= self.min_hits and track.time_since_update == 0
        ]
    
    def reset(self):
        """Reset the tracker."""
        self.tracks = {}
        self.kalman_filters = {}
        self.next_id = 1
        self.frame_count = 0


# ==================== Trajectory Predictor ====================

class TrajectoryPredictor:
    """
    Multimodal trajectory predictor for 3-second future prediction.
    Uses velocity extrapolation with uncertainty estimation.
    """
    
    def __init__(self, prediction_horizon: int = 90, fps: int = 30):
        self.prediction_horizon = prediction_horizon  # frames
        self.fps = fps
        self.history_length = 30  # frames to use for prediction
    
    def predict(self, track: Track, kalman_filter: Optional[EnhancedKalmanFilter] = None) -> List[Tuple[float, float]]:
        """
        Predict future trajectory for a track.
        
        Args:
            track: The track to predict for
            kalman_filter: Optional Kalman filter with velocity estimates
            
        Returns:
            List of predicted (x, y) positions
        """
        if len(track.trajectory) < 3:
            return []
        
        trajectory = track.trajectory
        
        # Get velocity from Kalman filter or estimate from trajectory
        if kalman_filter:
            vx, vy = kalman_filter.get_velocity()
        else:
            # Estimate velocity from recent trajectory
            recent = trajectory[-min(10, len(trajectory)):]
            if len(recent) >= 2:
                dx = recent[-1][0] - recent[0][0]
                dy = recent[-1][1] - recent[0][1]
                dt = len(recent) - 1
                vx = dx / dt if dt > 0 else 0
                vy = dy / dt if dt > 0 else 0
            else:
                vx, vy = 0, 0
        
        # Get current position
        current_x, current_y = trajectory[-1]
        
        # Generate predictions
        predictions = []
        for t in range(1, self.prediction_horizon + 1):
            # Simple linear extrapolation
            pred_x = current_x + vx * t
            pred_y = current_y + vy * t
            predictions.append((pred_x, pred_y))
        
        return predictions
    
    def predict_multimodal(self, track: Track, n_modes: int = 3) -> List[List[Tuple[float, float]]]:
        """
        Generate multiple possible trajectory predictions.
        
        Args:
            track: The track to predict for
            n_modes: Number of trajectory modes to generate
            
        Returns:
            List of trajectory predictions (one per mode)
        """
        if len(track.trajectory) < 3:
            return []
        
        base_prediction = self.predict(track)
        if not base_prediction:
            return []
        
        modes = [base_prediction]
        
        # Generate alternative trajectories with slight variations
        for i in range(1, n_modes):
            angle_offset = (i - n_modes // 2) * 15  # degrees
            angle_rad = np.radians(angle_offset)
            
            varied_prediction = []
            for t, (x, y) in enumerate(base_prediction):
                # Apply rotation around starting point
                start_x, start_y = track.trajectory[-1]
                dx = x - start_x
                dy = y - start_y
                
                # Rotate
                new_dx = dx * np.cos(angle_rad) - dy * np.sin(angle_rad)
                new_dy = dx * np.sin(angle_rad) + dy * np.cos(angle_rad)
                
                varied_prediction.append((start_x + new_dx, start_y + new_dy))
            
            modes.append(varied_prediction)
        
        return modes


# ==================== Base YOLO Model ====================

class BaseYOLOModel(ABC):
    """Abstract base class for YOLO models."""
    
    def __init__(self, model_path: str = None, confidence: float = 0.5, iou_threshold: float = 0.45):
        self.model_path = model_path
        self.confidence = confidence
        self.iou_threshold = iou_threshold
        self.model = None
        self.device = "cpu"
        self.class_names = []
        self.processing_times = deque(maxlen=30)
    
    @abstractmethod
    def load_model(self) -> bool:
        """Load the model."""
        pass
    
    @abstractmethod
    def detect(self, frame: np.ndarray) -> List[Detection]:
        """Run detection on a frame."""
        pass
    
    def get_fps(self) -> float:
        """Calculate current FPS."""
        if not self.processing_times:
            return 0.0
        return 1.0 / (sum(self.processing_times) / len(self.processing_times))
    
    def set_confidence(self, confidence: float):
        """Set confidence threshold."""
        self.confidence = max(0.1, min(1.0, confidence))
    
    def set_iou_threshold(self, iou: float):
        """Set IoU threshold."""
        self.iou_threshold = max(0.1, min(1.0, iou))


class YOLOv8Model(BaseYOLOModel):
    """YOLOv8 model implementation."""
    
    def __init__(self, model_size: str = "n", **kwargs):
        super().__init__(**kwargs)
        self.model_size = model_size
        self.name = f"YOLOv8{model_size}"
    
    def load_model(self) -> bool:
        if not YOLO_AVAILABLE:
            print(f"❌ Cannot load {self.name}: ultralytics not installed")
            return False
        
        try:
            model_name = self.model_path or f"yolov8{self.model_size}.pt"
            self.model = YOLO(model_name)
            self.class_names = self.model.names
            print(f"✅ Loaded {self.name}")
            return True
        except Exception as e:
            print(f"❌ Error loading {self.name}: {e}")
            return False
    
    def detect(self, frame: np.ndarray) -> List[Detection]:
        if self.model is None:
            return []
        
        start_time = time.time()
        
        try:
            results = self.model(frame, conf=self.confidence, iou=self.iou_threshold, verbose=False)
            
            detections = []
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        conf = float(box.conf[0])
                        cls_id = int(box.cls[0])
                        cls_name = self.class_names.get(cls_id, str(cls_id))
                        
                        detections.append(Detection(
                            bbox=(x1, y1, x2, y2),
                            confidence=conf,
                            class_id=cls_id,
                            class_name=cls_name
                        ))
            
            self.processing_times.append(time.time() - start_time)
            return detections
            
        except Exception as e:
            print(f"Detection error: {e}")
            return []


class YOLOv9Model(BaseYOLOModel):
    """YOLOv9 model implementation."""
    
    def __init__(self, model_size: str = "c", **kwargs):
        super().__init__(**kwargs)
        self.model_size = model_size
        self.name = f"YOLOv9{model_size}"
    
    def load_model(self) -> bool:
        if not YOLO_AVAILABLE:
            return False
        try:
            model_name = self.model_path or f"yolov9{self.model_size}.pt"
            self.model = YOLO(model_name)
            self.class_names = self.model.names
            print(f"✅ Loaded {self.name}")
            return True
        except Exception as e:
            print(f"❌ Error loading {self.name}: {e}")
            return False
    
    def detect(self, frame: np.ndarray) -> List[Detection]:
        # Same detection logic as v8
        if self.model is None:
            return []
        
        start_time = time.time()
        
        try:
            results = self.model(frame, conf=self.confidence, iou=self.iou_threshold, verbose=False)
            
            detections = []
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        conf = float(box.conf[0])
                        cls_id = int(box.cls[0])
                        cls_name = self.class_names.get(cls_id, str(cls_id))
                        
                        detections.append(Detection(
                            bbox=(x1, y1, x2, y2),
                            confidence=conf,
                            class_id=cls_id,
                            class_name=cls_name
                        ))
            
            self.processing_times.append(time.time() - start_time)
            return detections
        except Exception as e:
            return []


class YOLOv11Model(BaseYOLOModel):
    """YOLOv11 model implementation."""
    
    def __init__(self, model_size: str = "n", **kwargs):
        super().__init__(**kwargs)
        self.model_size = model_size
        self.name = f"YOLO11{model_size}"
    
    def load_model(self) -> bool:
        if not YOLO_AVAILABLE:
            return False
        try:
            model_name = self.model_path or f"yolo11{self.model_size}.pt"
            self.model = YOLO(model_name)
            self.class_names = self.model.names
            print(f"✅ Loaded {self.name}")
            return True
        except Exception as e:
            print(f"❌ Error loading {self.name}: {e}")
            return False
    
    def detect(self, frame: np.ndarray) -> List[Detection]:
        if self.model is None:
            return []
        
        start_time = time.time()
        
        try:
            results = self.model(frame, conf=self.confidence, iou=self.iou_threshold, verbose=False)
            
            detections = []
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        conf = float(box.conf[0])
                        cls_id = int(box.cls[0])
                        cls_name = self.class_names.get(cls_id, str(cls_id))
                        
                        detections.append(Detection(
                            bbox=(x1, y1, x2, y2),
                            confidence=conf,
                            class_id=cls_id,
                            class_name=cls_name
                        ))
            
            self.processing_times.append(time.time() - start_time)
            return detections
        except Exception as e:
            return []


class YOLOv12Model(BaseYOLOModel):
    """YOLOv12 model implementation (placeholder for future)."""
    
    def __init__(self, model_size: str = "n", **kwargs):
        super().__init__(**kwargs)
        self.model_size = model_size
        self.name = f"YOLO12{model_size}"
    
    def load_model(self) -> bool:
        if not YOLO_AVAILABLE:
            return False
        try:
            # YOLOv12 might use same ultralytics interface
            model_name = self.model_path or f"yolo12{self.model_size}.pt"
            self.model = YOLO(model_name)
            self.class_names = self.model.names
            print(f"✅ Loaded {self.name}")
            return True
        except Exception as e:
            print(f"❌ YOLO12 not available yet: {e}")
            return False
    
    def detect(self, frame: np.ndarray) -> List[Detection]:
        if self.model is None:
            return []
        
        start_time = time.time()
        
        try:
            results = self.model(frame, conf=self.confidence, iou=self.iou_threshold, verbose=False)
            
            detections = []
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        conf = float(box.conf[0])
                        cls_id = int(box.cls[0])
                        cls_name = self.class_names.get(cls_id, str(cls_id))
                        
                        detections.append(Detection(
                            bbox=(x1, y1, x2, y2),
                            confidence=conf,
                            class_id=cls_id,
                            class_name=cls_name
                        ))
            
            self.processing_times.append(time.time() - start_time)
            return detections
        except Exception as e:
            return []


# ==================== Model Ensemble ====================

class ModelEnsemble:
    """
    Manages multiple YOLO models and provides easy switching.
    """
    
    AVAILABLE_MODELS = {
        "YOLOv8n": lambda: YOLOv8Model(model_size="n"),
        "YOLOv8s": lambda: YOLOv8Model(model_size="s"),
        "YOLOv8m": lambda: YOLOv8Model(model_size="m"),
        "YOLOv9c": lambda: YOLOv9Model(model_size="c"),
        "YOLOv9e": lambda: YOLOv9Model(model_size="e"),
        "YOLO11n": lambda: YOLOv11Model(model_size="n"),
        "YOLO11s": lambda: YOLOv11Model(model_size="s"),
        "YOLO11m": lambda: YOLOv11Model(model_size="m"),
    }
    
    def __init__(self):
        self.models: Dict[str, BaseYOLOModel] = {}
        self.current_model: Optional[BaseYOLOModel] = None
        self.current_model_name: str = ""
    
    def get_available_models(self) -> List[str]:
        """Get list of available model names."""
        return list(self.AVAILABLE_MODELS.keys())
    
    def load_model(self, model_name: str) -> bool:
        """Load a specific model."""
        if model_name in self.models:
            self.current_model = self.models[model_name]
            self.current_model_name = model_name
            return True
        
        if model_name not in self.AVAILABLE_MODELS:
            print(f"❌ Unknown model: {model_name}")
            return False
        
        model = self.AVAILABLE_MODELS[model_name]()
        if model.load_model():
            self.models[model_name] = model
            self.current_model = model
            self.current_model_name = model_name
            return True
        
        return False
    
    def detect(self, frame: np.ndarray) -> List[Detection]:
        """Run detection with current model."""
        if self.current_model is None:
            return []
        return self.current_model.detect(frame)
    
    def set_confidence(self, confidence: float):
        """Set confidence threshold for current model."""
        if self.current_model:
            self.current_model.set_confidence(confidence)
    
    def set_iou_threshold(self, iou: float):
        """Set IoU threshold for current model."""
        if self.current_model:
            self.current_model.set_iou_threshold(iou)
    
    def get_fps(self) -> float:
        """Get current FPS."""
        if self.current_model:
            return self.current_model.get_fps()
        return 0.0


# ==================== Vision Engine (Main Class) ====================

class VisionEngine:
    """
    Main Vision Engine that combines detection, tracking, and prediction.
    """
    
    def __init__(self):
        self.model_ensemble = ModelEnsemble()
        self.tracker = MultiObjectTracker()
        self.predictor = TrajectoryPredictor()
        
        # Processing state
        self.is_processing = False
        self.current_frame = 0
        self.total_frames = 0
        
        # Metrics
        self.metrics = {
            "fps": 0.0,
            "object_count": 0,
            "total_detections": 0,
            "avg_confidence": 0.0,
            "track_count": 0
        }
    
    def load_model(self, model_name: str) -> bool:
        """Load a detection model."""
        return self.model_ensemble.load_model(model_name)
    
    def get_available_models(self) -> List[str]:
        """Get list of available models."""
        return self.model_ensemble.get_available_models()
    
    def set_confidence(self, confidence: float):
        """Set detection confidence threshold."""
        self.model_ensemble.set_confidence(confidence)
    
    def set_iou_threshold(self, iou: float):
        """Set NMS IoU threshold."""
        self.model_ensemble.set_iou_threshold(iou)
    
    def process_frame(self, frame: np.ndarray) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Process a single frame through detection, tracking, and visualization.
        
        Args:
            frame: Input frame (BGR format from OpenCV)
            
        Returns:
            Tuple of (annotated frame, metrics dict)
        """
        # Run detection
        detections = self.model_ensemble.detect(frame)
        
        # Update tracker
        tracks = self.tracker.update(detections)
        confirmed_tracks = self.tracker.get_confirmed_tracks()
        
        # Annotate frame
        annotated = self._draw_detections(frame.copy(), detections)
        annotated = self._draw_tracks(annotated, confirmed_tracks)
        
        # Update metrics
        self.metrics["fps"] = self.model_ensemble.get_fps()
        self.metrics["object_count"] = len(confirmed_tracks)
        self.metrics["total_detections"] = len(detections)
        self.metrics["track_count"] = len(tracks)
        
        if detections:
            self.metrics["avg_confidence"] = sum(d.confidence for d in detections) / len(detections)
        
        return annotated, self.metrics.copy()
    
    def _draw_detections(self, frame: np.ndarray, detections: List[Detection]) -> np.ndarray:
        """Draw detection boxes on frame."""
        for det in detections:
            x1, y1, x2, y2 = map(int, det.bbox)
            
            # Draw box
            color = (0, 255, 0)  # Green
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            
            # Draw label
            label = f"{det.class_name}: {det.confidence:.2f}"
            cv2.putText(frame, label, (x1, y1 - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
        
        return frame
    
    def _draw_tracks(self, frame: np.ndarray, tracks: List[Track]) -> np.ndarray:
        """Draw tracking trajectories on frame."""
        for track in tracks:
            if len(track.trajectory) < 2:
                continue
            
            # Draw trajectory
            color = (255, 0, 255)  # Magenta
            points = np.array(track.trajectory[-30:], dtype=np.int32)
            cv2.polylines(frame, [points], False, color, 2)
            
            # Draw track ID
            if track.trajectory:
                x, y = map(int, track.trajectory[-1])
                cv2.putText(frame, f"ID:{track.track_id}", (x, y - 25),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
        
        return frame
    
    def reset(self):
        """Reset the vision engine state."""
        self.tracker.reset()
        self.current_frame = 0
        self.is_processing = False
        self.metrics = {
            "fps": 0.0,
            "object_count": 0,
            "total_detections": 0,
            "avg_confidence": 0.0,
            "track_count": 0
        }
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current processing metrics."""
        return self.metrics.copy()


# Create global instance
vision_engine = VisionEngine()
