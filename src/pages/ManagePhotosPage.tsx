import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Grid,
  IconButton,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import {
  PhotoCamera,
  Delete,
  Edit,
  Close,
  CloudUpload,
  Image,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { axiosWithToken } from "../utils/axios";
import withAuth from "../components/HOC/withAuth";
import { useSelector } from "react-redux";
import { RootState } from "../redux toolkit/store";
import ActionResultDialog from "../components/dialogs/ActionResultDialog";

// Visual styles for the file input
const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

// Interface for photo items
interface PhotoItem {
  id?: number;
  url?: string;
  description: string;
  file: File | null;
  isUploading: boolean;
  isNew: boolean;
  descriptionEdited?: boolean;
  displayOrder?: number;
  uploadDate?: string;
}

const MAX_PHOTOS = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ACCEPTED_FORMATS_STRING = SUPPORTED_FORMATS.join(',');

// Utility to resize an image file
const resizeImage = (file: File, maxSizeInBytes: number): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = document.createElement("img");
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          return reject(new Error("Could not get canvas context"));
        }

        let { width, height } = img;
        const maxDimension = 1920; // Max width/height of 1920px

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.9;
        const attemptToGetBlob = () => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                if (blob.size <= maxSizeInBytes || quality <= 0.1) {
                  resolve(new File([blob], file.name, { type: file.type }));
                } else {
                  quality -= 0.1;
                  attemptToGetBlob(); // Re-run with lower quality
                }
              } else {
                reject(new Error("Canvas to Blob conversion failed"));
              }
            },
            file.type,
            quality
          );
        };
        attemptToGetBlob();
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

const ManagePhotosPage: React.FC = () => {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);
  const [tempDescription, setTempDescription] = useState("");
  const [tempDisplayOrder, setTempDisplayOrder] = useState<number | undefined>(undefined);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionDialogMessage, setActionDialogMessage] = useState("");
  const [actionDialogType, setActionDialogType] = useState<"success" | "failure">("success");
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);

  // Get the store UUID from Redux
  const selectedStoreId = useSelector(
    (state: RootState) => state.selectedStore.storeUuid
  );

  // Fetch existing photos when component mounts
  useEffect(() => {
    fetchPhotos();
  }, [selectedStoreId]);

  // Function to fetch existing photos
  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const response = await axiosWithToken.get(`/storeConfig/photos`);

      // Initialize with existing photos or empty array
      const existingPhotos = response.data.map((photo: any) => {
        let photoUrl = '';
        
        // Check if we have base64 encoded photo data
        if (photo.photoData && photo.contentType) {
          // Convert base64 data to data URL format
          photoUrl = `data:${photo.contentType};base64,${photo.photoData}`;
        } 
        // Fallback to URL if it exists
        else if (photo.url) {
          photoUrl = photo.url;
          
          // If URL doesn't start with http/https, add domain if needed
          if (!photoUrl.startsWith('http')) {
            photoUrl = process.env.REACT_APP_API_URL 
              ? `${process.env.REACT_APP_API_URL}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}` 
              : photoUrl;
          }
        }
        
        return {
          id: photo.id,
          url: photoUrl,
          description: photo.description || 'No description',
          file: null,
          isUploading: false,
          isNew: false,
          displayOrder: photo.displayOrder,
          uploadDate: photo.uploadDate,
        };
      }) || [];
      
      // Sort photos by displayOrder
      existingPhotos.sort((a: { displayOrder: any; }, b: { displayOrder: any; }) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

      setPhotos(existingPhotos);
    } catch (error) {
      console.error("Error fetching photos:", error);
      showActionDialog("Failed to load photos. Please try again.", "failure");
    } finally {
      setLoading(false);
    }
  };

  // Handle clicking a photo to view it
  const handlePhotoClick = (url: string) => {
    if (url) {
      setViewingPhotoUrl(url);
      setPhotoViewerOpen(true);
    }
  };

  // Handle closing the photo viewer
  const handlePhotoViewerClose = () => {
    setPhotoViewerOpen(false);
    setViewingPhotoUrl(null);
  };

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (photos.length >= MAX_PHOTOS) {
      showActionDialog(`You can only upload up to ${MAX_PHOTOS} photos.`, "failure");
      return;
    }

    // Check file type
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      showActionDialog(`Unsupported file type for ${file.name}. Please use JPEG, PNG, GIF, or WEBP.`, "failure");
      return;
    }

    let processedFile = file;
    if (file.size > MAX_FILE_SIZE) {
      try {
        processedFile = await resizeImage(file, MAX_FILE_SIZE);
        showActionDialog(`Photo ${file.name} was large and has been automatically compressed.`, "success");
      } catch (error) {
        console.error("Error resizing image:", error);
        showActionDialog(`Could not process ${file.name}. It might be corrupted.`, "failure");
        return;
      }
    }

    const description = processedFile.name.split('.')[0];
    const newPhoto: PhotoItem = {
      description: description.substring(0, 20),
      file: processedFile,
      isUploading: false,
      isNew: true,
      descriptionEdited: false,
      displayOrder: photos.length + 1, // Default for new photo
      uploadDate: undefined, // Not set until uploaded
    };

    setPhotos((prevPhotos) => {
      const newIndex = prevPhotos.length;
      setEditingPhotoIndex(newIndex);
      setTempDescription(newPhoto.description);
      setTempDisplayOrder(newPhoto.displayOrder);
      return [...prevPhotos, newPhoto];
    });

    event.target.value = '';
  };

  // Handle uploading a photo
  const handleUpload = async (index: number) => {
    const photo = photos[index];
    if (!photo.file || !photo.description.trim()) {
      showActionDialog("Please provide a description before uploading.", "failure");
      return;
    }

    setUploadingCount((prev) => prev + 1);
    setPhotos((prevPhotos) => 
      prevPhotos.map((p, i) => 
        i === index ? { ...p, isUploading: true } : p
      )
    );

    // Create a new FormData instance for each upload
    const formData = new FormData();
    
    // Make sure the file is valid before appending
    if (photo.file instanceof File && photo.file.size > 0) {
      // Explicitly add file with correct name 
      formData.append("file", photo.file, photo.file.name);
      formData.append("description", photo.description);
      
      try {
        // Remove all Content-Type headers to let the browser set it automatically with boundary
        const response = await axiosWithToken.post(
          "/storeConfig/photos",
          formData,
          {
            headers: {
              // Force axios to use the browser's boundary-setting mechanism
              'Content-Type': 'multipart/form-data',
            },
            // Prevent axios from trying to transform the request body
            transformRequest: [(data) => data],
          }
        );

        // Update the photo with the response data
        setPhotos((prevPhotos) =>
        prevPhotos.map((p, i) =>
          i === index
            ? {
                ...p,
                id: response.data.id,
                url: response.data.url,
                isUploading: false,
                isNew: false,
                displayOrder: response.data.displayOrder,
                uploadDate: response.data.uploadDate,
              }
            : p
        )
      );
      
      showActionDialog("Photo uploaded successfully!", "success");
    } catch (error) {
      console.error("Error uploading photo:", error);
      const errorResponseData = (error as any)?.response?.data;
      const errorMessage = errorResponseData?.detail || errorResponseData?.message;
      showActionDialog(
        errorMessage ? `Upload failed: ${errorMessage}` : "Failed to upload photo. Please try again.",
        "failure"
      );
      
      // Remove the failed upload
      setPhotos((prevPhotos) =>
        prevPhotos.filter((_, i) => i !== index)
      );
    } finally {
      setUploadingCount((prev) => prev - 1);
    }
    } else {
      // Handle invalid file
      console.error("Invalid file object:", photo.file);
      showActionDialog("Invalid file. Please try uploading again.", "failure");
      setPhotos((prevPhotos) => prevPhotos.filter((_, i) => i !== index));
      setUploadingCount((prev) => prev - 1);
    }
  };

  // Handle deleting a photo
  const handleDelete = async (index: number) => {
    const photo = photos[index];
    
    // If it's a new photo that hasn't been uploaded yet, just remove it from the state
    if (photo.isNew || !photo.id) {
      setPhotos((prevPhotos) => prevPhotos.filter((_, i) => i !== index));
      return;
    }
    
    // Otherwise, delete from server
    try {
      await axiosWithToken.delete(`/storeConfig/photos/${photo.id}`);
      setPhotos((prevPhotos) => prevPhotos.filter((_, i) => i !== index));
      showActionDialog("Photo deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting photo:", error);
      showActionDialog("Failed to delete photo. Please try again.", "failure");
    }
  };

  // Handle editing description
  const handleEditStart = (index: number) => {
    setEditingPhotoIndex(index);
    setTempDescription(photos[index].description);
    setTempDisplayOrder(photos[index].displayOrder);
  };

  // Save the edited description
  const handleEditSave = async () => {
    if (editingPhotoIndex === null) return;

    const photo = photos[editingPhotoIndex];

    // Validation for new and existing photos
    if (!tempDescription.trim()) {
      showActionDialog("Please provide a description before saving.", "failure");
      return;
    }

    // If it's a new photo, upload it
    if (photo.isNew) {
      // Only allow upload if file exists and description is valid
      if (!photo.file) {
        showActionDialog("No file selected for upload.", "failure");
        return;
      }
      setPhotos((prevPhotos) =>
        prevPhotos.map((p, i) =>
          i === editingPhotoIndex
            ? { ...p, description: tempDescription, descriptionEdited: true }
            : p
        )
      );
      setEditingPhotoIndex(null);
      // Call upload after state update
      setTimeout(() => handleUpload(editingPhotoIndex), 0);
      return;
    }

    const descriptionChanged = tempDescription !== photo.description;
    const displayOrderChanged =
      tempDisplayOrder !== undefined && tempDisplayOrder !== photo.displayOrder;

    if (
      displayOrderChanged &&
      (tempDisplayOrder === undefined ||
        tempDisplayOrder <= 0 ||
        tempDisplayOrder > photos.length)
    ) {
      showActionDialog(
        `Display order must be between 1 and ${photos.length}.`,
        "failure"
      );
      return;
    }

    // Otherwise, update on the server
    try {
      const updatePromises = [];
      if (descriptionChanged) {
        updatePromises.push(
          axiosWithToken.put(`/storeConfig/photos/${photo.id}`, {
            description: tempDescription,
          })
        );
      }
      if (displayOrderChanged && tempDisplayOrder !== undefined) {
        updatePromises.push(
          axiosWithToken.put(
            `/storeConfig/photos/${photo.id}/order/${tempDisplayOrder}`
          )
        );
      }

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        showActionDialog("Photo updated successfully!", "success");
        fetchPhotos(); // Re-fetch to get updated order
      }
    } catch (error) {
      console.error("Error updating photo:", error);
      showActionDialog("Failed to update photo. Please try again.", "failure");
    } finally {
      setEditingPhotoIndex(null);
    }
  };

  // Cancel editing
  const handleEditCancel = () => {
    setEditingPhotoIndex(null);
    setTempDescription("");
    setTempDisplayOrder(undefined);
  };

  // Show action dialog
  const showActionDialog = (message: string, type: "success" | "failure") => {
    setActionDialogMessage(message);
    setActionDialogType(type);
    setActionDialogOpen(true);
  };

  // Render upload button or loading state
  const renderUploadButton = (index: number) => {
    const photo = photos[index];
    
    if (photo.isUploading) {
      return <CircularProgress size={24} />;
    }
    
    if (photo.isNew) {
      return (
        <Button
          variant="contained"
          startIcon={<CloudUpload />}
          onClick={() => handleUpload(index)}
          disabled={!photo.description.trim() || !photo.descriptionEdited}
        >
          Upload
        </Button>
      );
    }
    
    return null;
  };

  // Render
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h4" component="h1">
          Manage Photos
        </Typography>
        <Box>
          <Button
            component="label"
            variant="contained"
            startIcon={<PhotoCamera />}
            disabled={photos.length >= MAX_PHOTOS || uploadingCount > 0}
          >
            Add a Photo
            <VisuallyHiddenInput 
              type="file" 
              onChange={handleFileSelect} 
              accept={ACCEPTED_FORMATS_STRING} 
            />
          </Button>
        </Box>
      </Box>
      {/* Helper text */}
      <Paper sx={{ p: 2, mb: 4, backgroundColor: "#f5f5f5" }}>
        <Typography variant="body1">
          Upload up to {MAX_PHOTOS} photos for your store. Each photo should be less than 5MB.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          These photos will be displayed on your store's booking page to showcase your business.
        </Typography>
      </Paper>
      
      {/* Loading state */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Empty state */}
          {photos.length === 0 ? (
            <Paper 
              sx={{ 
                p: 4, 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center",
                backgroundColor: "#f9f9f9",
                border: "2px dashed #ccc"
              }}
            >
              <Image sx={{ fontSize: 60, color: "#aaa", mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No Photos Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: "center" }}>
                Upload photos to showcase your business to customers
              </Typography>
              <Button
                component="label"
                variant="contained"
                startIcon={<PhotoCamera />}
              >
                Add Your First Photo
                <VisuallyHiddenInput 
                  type="file" 
                  onChange={handleFileSelect} 
                  accept={ACCEPTED_FORMATS_STRING} 
                />
              </Button>
            </Paper>
          ) : (
            /* Photo grid */
            <Grid container spacing={3}>
              {photos.map((photo, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={photo.id || `new-${index}`}>
                  <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                    <CardMedia
                      component="img"
                      height="140"
                      image={photo.url || (photo.file ? URL.createObjectURL(photo.file) : "")}
                      alt={photo.description}
                      onClick={() => handlePhotoClick(photo.url || (photo.file ? URL.createObjectURL(photo.file) : ""))}
                      sx={{ cursor: "pointer" }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      {editingPhotoIndex === index ? (
                        <>
                          <TextField
                            fullWidth
                            label="Description"
                            variant="outlined"
                            value={tempDescription}
                            onChange={(e) => setTempDescription(e.target.value)}
                            autoFocus
                            size="small"
                            sx={{ mb: 2 }}
                          />
                          <TextField
                            fullWidth
                            label="Display Order"
                            variant="outlined"
                            type="number"
                            value={tempDisplayOrder ?? ''}
                            onChange={(e) => setTempDisplayOrder(parseInt(e.target.value, 10))}
                            size="small"
                            disabled={photo.isNew}
                          />
                        </>
                      ) : (
                        <>
                          <Typography variant="body2" color="text.secondary">
                            {photo.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Order: { photo.displayOrder }
                          </Typography>
                        </>
                      )}
                    </CardContent>
                    <CardActions sx={{ justifyContent: "space-between" }}>
                      <Box>
                        {editingPhotoIndex === index ? (
                          <>
                            <Button size="small" onClick={handleEditSave}>Save</Button>
                            <Button size="small" onClick={handleEditCancel}>Cancel</Button>
                          </>
                        ) : (
                          <Tooltip title="Edit description">
                            <IconButton onClick={() => handleEditStart(index)} size="small">
                              <Edit />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete photo">
                          <IconButton onClick={() => handleDelete(index)} size="small">
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      {/* {renderUploadButton(index)} */}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
      
      {/* Info about remaining slots */}
      {photos.length > 0 && (
        <Box sx={{ mt: 4, textAlign: "right" }}>
          <Typography variant="body2" color="text.secondary">
            {photos.length} of {MAX_PHOTOS} photos used
          </Typography>
        </Box>
      )}
      
      {/* Result dialog */}
      <ActionResultDialog
        open={actionDialogOpen}
        onClose={() => setActionDialogOpen(false)}
        message={actionDialogMessage}
        type={actionDialogType}
      />

      {/* Photo Viewer Dialog */}
      <Dialog open={photoViewerOpen} onClose={handlePhotoViewerClose} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ m: 0, p: 2 }}>
          Photo Preview
          <IconButton
            aria-label="close"
            onClick={handlePhotoViewerClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {viewingPhotoUrl && (
            <img 
              src={viewingPhotoUrl} 
              alt="Enlarged view" 
              style={{ width: '100%', height: 'auto', display: 'block' }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default withAuth(ManagePhotosPage);