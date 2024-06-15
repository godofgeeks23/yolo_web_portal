# import the InferencePipeline interface
from inference import InferencePipeline
# import a built-in sink called render_boxes (sinks are the logic that happens after inference)
from inference.core.interfaces.stream.sinks import render_boxes

api_key = "YOUR_ROBOFLOW_API_KEY"

# create an inference pipeline object
pipeline = InferencePipeline.init(
    model_id="yolov8x-1280", # set the model id to a yolov8x model with in put size 1280
    video_reference="https://storage.googleapis.com/com-roboflow-marketing/inference/people-walking.mp4", # set the video reference (source of video), it can be a link/path to a video file, an RTSP stream url, or an integer representing a device id (usually 0 for built in webcams)
    on_prediction=render_boxes, # tell the pipeline object what to do with each set of inference by passing a function
    api_key=api_key, # provide your roboflow api key for loading models from the roboflow api
)
# start the pipeline
pipeline.start()
# wait for the pipeline to finish
pipeline.join()