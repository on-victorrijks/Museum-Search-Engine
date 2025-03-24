from transformers import CLIPProcessor, CLIPModel
import torch
from transformers import AutoTokenizer

class Model:
    def __init__(
        self, 
        model_name,
        base_name,
        weights_path,
        device,
    ):
        self.model_name = model_name
        self.base_name = base_name
        self.weights_path = weights_path
        self.device = device

        self.processor = CLIPProcessor.from_pretrained(base_name)
        self.model = CLIPModel.from_pretrained(base_name).to(device)
        self.tokenizer = AutoTokenizer.from_pretrained(base_name)
        self.model.load_state_dict(torch.load(weights_path, weights_only=True))

    def encode_text(self, text):
        inputs = self.tokenizer(text, return_tensors="pt", padding=True, truncation=True)
        inputs = inputs.to(self.device)
        outputs = self.model.get_text_features(**inputs).squeeze()
        # If the device is not cpu, convert the output to a numpy array
        if self.device != "cpu":
            outputs = outputs.detach().cpu().numpy()
        else:
            outputs = outputs.numpy()
        return outputs