
import os
import json
import base64
from google import genai
from google.genai import types

def get_client():
    return genai.Client(api_key=os.environ["API_KEY"])

def analyze_try_on(person_b64, top_b64, bottom_b64, dress_b64, gender):
    client = get_client()
    
    prompt = f"""
    Act as a Senior AI Research Engineer specializing in Virtual Try-on synthesis for {gender}.
    TASK: Generate a 'Condition Map' for clothing synthesis.
    Key Analysis Point: 
    - Precisely identify the sleeve length of the provided assets (Short/Half vs Long).
    - Map spatial boundaries and foreground occlusions.
    """
    
    contents = [
        types.Part.from_text(text=prompt),
        types.Part.from_bytes(data=base64.b64decode(person_b64), mime_type="image/jpeg")
    ]
    
    if top_b64:
        contents.append(types.Part.from_bytes(data=base64.b64decode(top_b64), mime_type="image/jpeg"))
    if bottom_b64:
        contents.append(types.Part.from_bytes(data=base64.b64decode(bottom_b64), mime_type="image/jpeg"))
    if dress_b64:
        contents.append(types.Part.from_bytes(data=base64.b64decode(dress_b64), mime_type="image/jpeg"))

    response = client.models.generate_content(
        model='gemini-3-flash-preview',
        contents=contents,
        config=types.GenerateContentConfig(
            temperature=0,
            response_mime_type="application/json",
            response_schema={
                "type": "OBJECT",
                "properties": {
                    "garmentDescription": {"type": "STRING"},
                    "personDescription": {"type": "STRING"},
                    "bodySize": {"type": "STRING"},
                    "technicalPrompt": {"type": "STRING"},
                    "stylingSuggestions": {
                        "type": "OBJECT",
                        "properties": {
                            "suggestedPants": {"type": "STRING"},
                            "suggestedShoes": {"type": "STRING"},
                            "suggestedShirt": {"type": "STRING"},
                            "styleVibe": {"type": "STRING"}
                        }
                    }
                },
                "required": ["garmentDescription", "personDescription", "body_size", "technicalPrompt", "stylingSuggestions"]
            }
        )
    )
    return json.loads(response.text)

def generate_virtual_try_on_image(person_b64, top_b64, bottom_b64, dress_b64, technical_prompt, body_size, gender):
    client = get_client()
    
    prompt = f"""
    TASK: Virtual Try-on Synthesis. 
    Fit provided garments onto the person.
    STRICT RULE: Respect the reference garment's sleeve length. 
    If the reference top is short-sleeved, show the person's arms. 
    Do NOT extend a short-sleeved shirt to match long sleeves from the base template.
    Preserve foreground hands and accessories.
    Context: {technical_prompt}
    """
    
    contents = [
        types.Part.from_text(text=prompt),
        types.Part.from_bytes(data=base64.b64decode(person_b64), mime_type="image/jpeg")
    ]
    
    if top_b64:
        contents.append(types.Part.from_bytes(data=base64.b64decode(top_b64), mime_type="image/jpeg"))
    if bottom_b64:
        contents.append(types.Part.from_bytes(data=base64.b64decode(bottom_b64), mime_type="image/jpeg"))
    if dress_b64:
        contents.append(types.Part.from_bytes(data=base64.b64decode(dress_b64), mime_type="image/jpeg"))

    response = client.models.generate_content(
        model='gemini-2.5-flash-image',
        contents=contents,
        config=types.GenerateContentConfig(temperature=0)
    )
    
    for part in response.candidates[0].content.parts:
        if part.inline_data:
            return f"data:{part.inline_data.mime_type};base64,{base64.b64encode(part.inline_data.data).decode()}"
    return None
