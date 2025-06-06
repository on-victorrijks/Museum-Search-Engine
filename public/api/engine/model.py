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

        print(f"    Loading processor, model and tokenizer...")
        self.processor = CLIPProcessor.from_pretrained(base_name)
        self.model = CLIPModel.from_pretrained(base_name).to(device)
        self.tokenizer = AutoTokenizer.from_pretrained(base_name)
        print(f"    ✓ : Processor, model and tokenizer loaded")
        print(f"Loading weights...")
        if self.device != "cpu":
            self.model.load_state_dict(torch.load(weights_path, weights_only=True))
        else:
            self.model.load_state_dict(torch.load(weights_path, map_location=torch.device('cpu')))
        print(f"    ✓ : Weights loaded")

    def get_model_name(self):
        return self.model_name

    def encode_text(self, text):
        with torch.no_grad():
            inputs = self.tokenizer(text, return_tensors="pt", padding=True, truncation=True)

            if self.device != "cpu":
                inputs = inputs.to(self.device)

            outputs = self.model.get_text_features(**inputs).squeeze()
            # If the device is not cpu, convert the output to a numpy array

            if self.device != "cpu":
                outputs = outputs.cpu().numpy()
            else:
                outputs = outputs.numpy()

        return outputs