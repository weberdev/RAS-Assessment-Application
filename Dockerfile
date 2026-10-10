FROM node:22-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS backend
WORKDIR /src
COPY server/*.csproj ./server/
RUN dotnet restore ./server/
COPY server/ ./server/
COPY --from=frontend /app/dist/ ./server/wwwroot/
RUN dotnet publish ./server/ -c Release -o /publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=backend /publish/ ./
ENV ASPNETCORE_URLS=http://0.0.0.0:10000
EXPOSE 10000
ENTRYPOINT ["dotnet", "server.dll"]