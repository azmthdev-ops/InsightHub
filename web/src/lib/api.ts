export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const uploadDataset = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_URL}/data/upload`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        throw new Error("Failed to upload dataset");
    }

    return response.json();
};

export const getDatasetStatus = async () => {
    const response = await fetch(`${API_URL}/data/list`);
    if (!response.ok) {
        throw new Error("Failed to get dataset status");
    }
    return response.json();
};

export const executeCode = async (code: string) => {
    const response = await fetch(`${API_URL}/execute`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to execute code");
    }

    return response.json();
};
