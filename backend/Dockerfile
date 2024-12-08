FROM python:3.10

WORKDIR /app

# Copy the badproxy file to the apt configuration folder
COPY ./badproxy /etc/apt/apt.conf.d/99fixbadproxy

# Update and install the required packages
RUN apt-get update && apt-get install ffmpeg libsm6 libxext6 -y

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .