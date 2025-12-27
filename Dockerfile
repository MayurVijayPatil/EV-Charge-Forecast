FROM node:20-bullseye

# 1. Install Python 3 and pip (Required for your ML Forecast Engine)
# WE ADD A SYMLINK so 'python' command points to 'python3'
RUN apt-get update && apt-get install -y python3 python3-pip && ln -sf /usr/bin/python3 /usr/bin/python

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy package.json to install dependencies first (Caching layer)
COPY package*.json ./

# 4. Install Node.js dependencies
RUN npm install

# 5. Install Python dependencies (Pandas, Scikit-Learn, NumPy)
RUN pip3 install pandas numpy scikit-learn

# 6. Copy the rest of your project files
COPY . .

# 7. Build the Frontend (React + Vite)
RUN npx vite build

# 8. Expose the port your server listens on
EXPOSE 5000

# 9. Start the application
CMD ["npx", "tsx", "server/index.ts"]
