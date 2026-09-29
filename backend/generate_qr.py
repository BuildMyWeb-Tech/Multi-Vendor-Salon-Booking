import sys
import qrcode
from io import BytesIO

if __name__ == "__main__":
    upi_id = sys.argv[1] if len(sys.argv) > 1 else ""
    name   = sys.argv[2] if len(sys.argv) > 2 else ""
    amount = sys.argv[3] if len(sys.argv) > 3 else ""

    upi_url = "upi://pay?pa=" + upi_id + "&pn=" + name + "&cu=INR"
    if amount:
        upi_url += "&am=" + amount

    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10, border=4)
    qr.add_data(upi_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    sys.stdout.buffer.write(buf.getvalue())
