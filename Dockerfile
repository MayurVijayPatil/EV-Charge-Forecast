FROM node:20-bullseye

# 1. Install Python 3 and pip (Required for your ML Forecast Engine)
RUN apt-get update && apt-get install -y python3 python3-pip

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy package.json to install dependencies first (Caching layer)
COPY package*.json ./

# 4. Install Node.js dependencies (including "tsx" for running the server)
RUN npm install

# 5. Install Python dependencies (Pandas, Scikit-Learn, NumPy)
RUN pip3 install pandas numpy scikit-learn

# 6. Copy the rest of your project files
COPY . .

# 7. Build the Frontend (React + Vite)
# We use npx to run the local vite command
RUN npx vite build

# 8. Expose the port your server listens on (5000)
EXPOSE 5000

# 9. Start the application
# We use 'npx tsx' to run the server directly from TypeScript files
CMD ["npx", "tsx", "server/index.ts"]
