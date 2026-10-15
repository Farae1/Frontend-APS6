FROM python:3.12-slim

WORKDIR /app

# The models, downloaded once at build time:
# - YuNet face detector (OpenCV Zoo, MIT)
# - ArcFace ResNet-50 / WebFace600K (InsightFace buffalo_l; non-commercial research use)
ADD https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx models/yunet.onnx
RUN python -c "import urllib.request, zipfile; \
urllib.request.urlretrieve('https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip', '/tmp/buffalo_l.zip'); \
zipfile.ZipFile('/tmp/buffalo_l.zip').extract('w600k_r50.onnx', 'models')" \
    && rm /tmp/buffalo_l.zip

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY *.py .

EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
