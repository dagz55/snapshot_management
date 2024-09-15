package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/Azure/azure-sdk-for-go/sdk/azcore"
	"github.com/Azure/azure-sdk-for-go/sdk/azcore/to"
	"github.com/Azure/azure-sdk-for-go/sdk/azidentity"
	"github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/compute/armcompute"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

var cred azcore.TokenCredential

func azureLogin(c *gin.Context) {
	deviceCodeCredential, err := azidentity.NewDeviceCodeCredential(&azidentity.DeviceCodeCredentialOptions{
		TenantID: os.Getenv("REACT_APP_REACT_APP_AZURE_TENANT_ID"),
		ClientID: os.Getenv("REACT_APP_REACT_APP_AZURE_CLIENT_ID"),
		UserPrompt: func(ctx context.Context, dcMessage azidentity.DeviceCodeMessage) error {
			fmt.Println(dcMessage.Message)
			return nil
		},
	})
	if err != nil {
		log.Printf("Failed to obtain credential: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to login to Azure: %v", err)})
		return
	}

	cred = deviceCodeCredential

	c.JSON(http.StatusOK, gin.H{"message": "Logged in to Azure successfully."})
}

func createSnapshot(c *gin.Context) {
	if cred == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not logged in to Azure"})
		return
	}

	var request struct {
		ResourceGroupName string `json:"resourceGroupName"`
		SnapshotName      string `json:"snapshotName"`
		DiskID            string `json:"diskId"`
		Location          string `json:"location"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Invalid request: %v", err)})
		return
	}

	ctx := context.Background()
	snapshotsClient, err := armcompute.NewSnapshotsClient(os.Getenv("REACT_APP_AZURE_SUBSCRIPTION_ID"), cred, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create snapshots client: %v", err)})
		return
	}

	snapshot := armcompute.Snapshot{
		Location: to.Ptr(request.Location),
		Properties: &armcompute.SnapshotProperties{
			CreationData: &armcompute.CreationData{
				CreateOption: to.Ptr(armcompute.DiskCreateOptionCopy),
				SourceURI:    to.Ptr(request.DiskID),
			},
		},
	}

	pollerResp, err := snapshotsClient.BeginCreateOrUpdate(ctx, request.ResourceGroupName, request.SnapshotName, snapshot, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to initiate snapshot creation: %v", err)})
		return
	}

	_, err = pollerResp.PollUntilDone(ctx, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create snapshot: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Snapshot created successfully."})
}

func deleteSnapshot(c *gin.Context) {
	if cred == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not logged in to Azure"})
		return
	}

	var request struct {
		ResourceGroupName string `json:"resourceGroupName"`
		SnapshotName      string `json:"snapshotName"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Invalid request: %v", err)})
		return
	}

	ctx := context.Background()
	snapshotsClient, err := armcompute.NewSnapshotsClient(os.Getenv("REACT_APP_AZURE_SUBSCRIPTION_ID"), cred, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create snapshots client: %v", err)})
		return
	}

	pollerResp, err := snapshotsClient.BeginDelete(ctx, request.ResourceGroupName, request.SnapshotName, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to initiate snapshot deletion: %v", err)})
		return
	}

	_, err = pollerResp.PollUntilDone(ctx, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to delete snapshot: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Snapshot deleted successfully."})
}

func validateSnapshot(c *gin.Context) {
	if cred == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not logged in to Azure"})
		return
	}

	resourceGroupName := c.Query("resourceGroupName")
	snapshotName := c.Query("snapshotName")

	if resourceGroupName == "" || snapshotName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "resourceGroupName and snapshotName are required"})
		return
	}

	ctx := context.Background()
	snapshotsClient, err := armcompute.NewSnapshotsClient(os.Getenv("REACT_APP_AZURE_SUBSCRIPTION_ID"), cred, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create snapshots client: %v", err)})
		return
	}

	_, err = snapshotsClient.Get(ctx, resourceGroupName, snapshotName, nil)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("Snapshot not found: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Snapshot is valid and exists."})
}

func getSnapshotsByAge(c *gin.Context) {
	if cred == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not logged in to Azure"})
		return
	}

	daysParam := c.Query("days")
	days, err := strconv.Atoi(daysParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid 'days' parameter"})
		return
	}

	ctx := context.Background()
	snapshotsClient, err := armcompute.NewSnapshotsClient(os.Getenv("REACT_APP_AZURE_SUBSCRIPTION_ID"), cred, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create snapshots client: %v", err)})
		return
	}

	pager := snapshotsClient.NewListPager(nil)
	var snapshots []map[string]interface{}

	for pager.More() {
		pageResp, err := pager.NextPage(ctx)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to list snapshots: %v", err)})
			return
		}

		for _, snapshot := range pageResp.Value {
			if snapshot.Properties != nil && snapshot.Properties.TimeCreated != nil {
				snapshotAge := time.Since(*snapshot.Properties.TimeCreated)
				if snapshotAge.Hours() > float64(days*24) {
					snapshots = append(snapshots, map[string]interface{}{
						"name":          *snapshot.Name,
						"resourceGroup": *snapshot.ID,
						"creationTime":  *snapshot.Properties.TimeCreated,
					})
				}
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"snapshots": snapshots})
}

func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "OK"})
}

func main() {
	requiredEnvVars := []string{"REACT_APP_AZURE_TENANT_ID", "REACT_APP_AZURE_CLIENT_ID", "REACT_APP_AZURE_SUBSCRIPTION_ID"}
	for _, envVar := range requiredEnvVars {
		if os.Getenv(envVar) == "" {
			log.Fatalf("Environment variable %s is not set", envVar)
		}
	}

	router := gin.Default()

	// Add CORS middleware
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:8080", "http://localhost:80"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Authorization", "Content-Type"}
	config.AllowCredentials = true
	router.Use(cors.New(config))

	router.GET("/login", azureLogin)
	router.POST("/create-snapshot", createSnapshot)
	router.POST("/delete-snapshot", deleteSnapshot)
	router.GET("/validate-snapshot", validateSnapshot)
	router.GET("/snapshots-by-age", getSnapshotsByAge)
	router.GET("/health", healthCheck)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: router,
	}

	go func() {
		log.Printf("Starting server on port %s...", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %s\n", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exiting")
}
