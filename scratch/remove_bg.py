from PIL import Image

def main():
    im = Image.open('public/logo.png')
    im = im.convert('RGBA')
    datas = im.getdata()

    newData = []
    for item in datas:
        r, g, b, a = item
        # Calculate average of color channels to see how close to white it is
        avg = (r + g + b) / 3.0
        
        if r > 235 and g > 235 and b > 235:
            # Linear interpolation for smooth edges
            if avg >= 253:
                alpha = 0
            elif avg <= 235:
                alpha = 255
            else:
                alpha = int(((253.0 - avg) / (253.0 - 235.0)) * 255)
            
            # Preserve original alpha if it was already less
            alpha = min(a, alpha)
            # Make the background color transparent but keep color values for edge blending
            newData.append((r, g, b, alpha))
        else:
            newData.append(item)

    im.putdata(newData)
    im.save('public/logo.png', 'PNG')
    print("Background removed successfully")

if __name__ == '__main__':
    main()
