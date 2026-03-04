# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj files and restore dependencies
COPY ["backend/CapSyncer.Server.csproj", "backend/"]
COPY ["CapSyncer.ServiceDefaults/CapSyncer.ServiceDefaults.csproj", "CapSyncer.ServiceDefaults/"]
RUN dotnet restore "backend/CapSyncer.Server.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/backend"
RUN dotnet build "CapSyncer.Server.csproj" -c Release -o /app/build

# Stage 2: Publish
FROM build AS publish
RUN dotnet publish "CapSyncer.Server.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy published app
COPY --from=publish /app/publish .

# Set ownership
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "CapSyncer.Server.dll"]
