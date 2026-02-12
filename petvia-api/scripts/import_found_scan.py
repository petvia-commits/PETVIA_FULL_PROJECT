import os, json, re, sys

IMPORT_DIR = os.environ.get("IMPORT_DIR", "/data/petvia")

IMG_EXTS = {".jpg", ".jpeg", ".png", ".webp"}

def read_text(p):
    try:
        with open(p, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except:
        return ""

def main():
    if not os.path.isdir(IMPORT_DIR):
        print("[]")
        return 0

    items = []
    for root, _, files in os.walk(IMPORT_DIR):
        for fn in files:
            base, ext = os.path.splitext(fn)
            ext = ext.lower()
            if ext not in IMG_EXTS:
                continue
            img_path = os.path.join(root, fn)
            txt_path = os.path.join(root, base + ".txt")
            if not os.path.exists(txt_path):
                # tenta .TXT
                txt_path2 = os.path.join(root, base + ".TXT")
                if os.path.exists(txt_path2):
                    txt_path = txt_path2
                else:
                    txt_path = None

            text = read_text(txt_path) if txt_path else ""
            items.append({
                "image_path": img_path,
                "txt_path": txt_path,
                "text": text
            })

    print(json.dumps(items, ensure_ascii=False))
    return 0

if __name__ == "__main__":
    sys.exit(main())
