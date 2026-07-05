import os
import base64
from pathlib import Path

def main():
    """
    Main entry point for the rename application.
    """
    try:
        path = Path(input("Enter the path to the image file: ").strip("\"'"))
        if path.is_file():
            rename_image(input("Enter the new name for the image file (without extension): ").strip("\"'"), path)
        elif not path.exists():
            print(
                "The provided path does not exist. Please provide a valid image file."
            )
        else:
            print("Invalid path. Please provide a valid image file.")

    except Exception as e:
        print(f"Error: {e}")
        import traceback

        traceback.print_exc()

def rename_image(new_name, image_path):
    """
    Rename a single image file manually
    """
    if new_name:
        # Add the original file extension to the new name
        ext = os.path.splitext(str(image_path))[1]
        new_name_with_ext = f"{new_name}{ext}"
        confirm_and_rename(image_path, new_name_with_ext)

def confirm_and_rename(original_path, new_name):
    """
    Ask user for confirmation and rename the file.

    Args:
        original_path: Path object of original file
        new_name: New filename (string)
    """
    new_path = original_path.parent / new_name
    print(f"Original file: {original_path}")
    print(f"New file name: {new_path}")

    confirm = input("Do you want to rename the file? (y/n): ").strip().lower()
    if confirm == 'y':
        os.rename(original_path, new_path)
        print(f"File renamed to: {new_path}")
    elif confirm == 'n':
        print("Rename cancelled.")
    else:
        print("Invalid input. Rename cancelled.")

main()
