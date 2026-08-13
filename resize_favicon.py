import sys
from PIL import Image

def reduce_icon_size(img_path, out_path, multiplier):
    # Open the original image
    img = Image.open(img_path)
    
    # Calculate dimensions for a canvas that is 1.4x larger
    # This effectively makes the logo appear ~70% of its original size
    width, height = img.size
    new_size = int(max(width, height) * multiplier)
    
    # Create a new transparent background
    new_img = Image.new("RGBA", (new_size, new_size), (0, 0, 0, 0))
    
    # Calculate center offset
    offset_x = (new_size - width) // 2
    offset_y = (new_size - height) // 2
    
    # Paste the original image into the center
    new_img.paste(img, (offset_x, offset_y))
    
    # Save it to the output path
    new_img.save(out_path)
    print(f"Successfully padded with multiplier {multiplier}")

if __name__ == "__main__":
    in_path = sys.argv[1]
    out_path = sys.argv[2]
    multiplier = float(sys.argv[3])
    reduce_icon_size(in_path, out_path, multiplier)
