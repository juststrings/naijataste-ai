"""
Check available Gemini models and their token limits before running the main script.

Usage:
    python check_gemini_models.py
    python check_gemini_models.py --api_key YOUR_KEY
"""

import os
import argparse
from google import genai


def load_env(path=".env"):
    if os.path.exists(path):
        with open(path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--api_key", default=None)
    args = parser.parse_args()

    load_env()

    api_key = args.api_key or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: No API key found. Add GEMINI_API_KEY to .env")
        return

    client = genai.Client(api_key=api_key)

    print("Fetching available models...")
    print()

    models = client.models.list()

    generate_models = []
    for m in models:
        supported = getattr(m, "supported_actions", None) or getattr(m, "supported_generation_methods", [])
        if "generateContent" in str(supported):
            generate_models.append(m)

    print(f"Models that support generateContent: {len(generate_models)}")
    print("=" * 70)

    for m in generate_models:
        name = getattr(m, "name", "unknown")
        display = getattr(m, "display_name", "")
        input_limit = getattr(m, "input_token_limit", "N/A")
        output_limit = getattr(m, "output_token_limit", "N/A")
        description = getattr(m, "description", "")

        print(f"Model:        {name}")
        print(f"Display name: {display}")
        print(f"Input limit:  {input_limit} tokens")
        print(f"Output limit: {output_limit} tokens")
        if description:
            print(f"Description:  {description[:120]}")
        print("-" * 70)


if __name__ == "__main__":
    main()