import React, { useCallback, useEffect, useState } from "react";
import AddCategoryDialog from "../components/AddCategoryDialog";
import EditCategoryDialog from "../components/EditCategoryDialog";
import ServiceDialog from "../components/ServiceDialog";
import { axiosWithToken } from "../utils/axios";
import { useSelector } from "react-redux";
import { RootState } from "../redux toolkit/store";
import withAuth from "../components/HOC/withAuth";
import ErrorOverlayComponent from "../components/ErrorOverlayComponent";
import {
  Box,
  Container,
  Paper,
  Typography,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  Collapse,
  Chip,
  IconButton,
  Fade,
  useTheme,
  useMediaQuery,
  Divider,
  Button,
} from "@mui/material";
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Add as AddIcon,
  Edit as EditIcon,
  AccessTime as AccessTimeIcon,
  AttachMoney as AttachMoneyIcon,
  Sort as SortIcon,
} from "@mui/icons-material";

interface ServiceType {
  id: number;
  type: string;
  levelType: number;
  description: string | null;
  displayOrder: number;
  storeUuid: string;
  active: boolean;
  tenantUuid: string;
  serviceItems: ServiceItem[];
}

interface ExpandableDescriptionProps {
  description: string;
  maxLength?: number;
}

const ExpandableDescription: React.FC<ExpandableDescriptionProps> = ({
  description,
  maxLength = 100,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldShowButton = description.length > maxLength;
  const displayText =
    !isExpanded && shouldShowButton
      ? `${description.slice(0, maxLength)}...`
      : description;

  return (
    <Box>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          mt: 0.5,
          whiteSpace: "pre-wrap",
          transition: "all 0.3s ease",
        }}
      >
        {displayText}
      </Typography>
      {shouldShowButton && (
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          size="small"
          sx={{
            mt: 0.5,
            p: 0,
            minWidth: "auto",
            textTransform: "none",
            color: "primary.main",
            "&:hover": {
              background: "none",
              textDecoration: "underline",
            },
          }}
        >
          {isExpanded ? "Show Less" : "Show More"}
        </Button>
      )}
    </Box>
  );
};

const ServiceTypePage: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updateTrigger, setUpdateTrigger] = useState<boolean>(false);
  const [serviceType, setServiceType] = useState<ServiceType[]>([]);
  const [expandedTypes, setExpandedTypes] = useState<{
    [key: number]: boolean;
  }>({});

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const selectedStoreId = useSelector(
    (state: RootState) => state.selectedStore.storeUuid
  );

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosWithToken.get<ServiceType[]>(`/serviceType/`);
      setServiceType(response.data);
      setError(null);
    } catch (error) {
      setError("Error fetching data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories, updateTrigger, selectedStoreId]);

  const handleUpdate = () => {
    setUpdateTrigger(!updateTrigger);
  };

  const toggleExpand = (typeId: number) => {
    setExpandedTypes((prev) => ({
      ...prev,
      [typeId]: !prev[typeId],
    }));
  };

  const handleFilterChange = (event: SelectChangeEvent<string>) => {
    setFilterStatus(event.target.value);
  };

  const filteredServiceTypes = serviceType
    .filter((type) =>
      filterStatus === "all"
        ? true
        : filterStatus === "active"
        ? type.active
        : !type.active
    )
    .sort((a, b) => a.displayOrder - b.displayOrder);

  if (error) {
    return <ErrorOverlayComponent />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, sm: 3 },
          mb: 4,
          borderRadius: 2,
          background: theme.palette.background.paper,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
            mb: 3,
          }}
        >
          <Typography
            variant={isMobile ? "h5" : "h4"}
            component="h1"
            sx={{ fontWeight: "bold" }}
          >
            Service Categories
          </Typography>

          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={filterStatus}
                onChange={handleFilterChange}
                displayEmpty
                variant="outlined"
                startAdornment={<SortIcon sx={{ mr: 1 }} />}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
            <AddCategoryDialog onUpdate={handleUpdate} />
          </Box>
        </Box>

        <Box sx={{ mt: 3 }}>
          {filteredServiceTypes.map((type) => (
            <Fade in key={type.id}>
              <Paper
                elevation={1}
                sx={{
                  mb: 2,
                  overflow: "hidden",
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  borderLeft: `4px solid ${
                    type.active
                      ? theme.palette.success.main
                      : theme.palette.grey[500]
                  }`,
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: type.active
                      ? "rgba(76, 175, 80, 0.04)"
                      : "rgba(0, 0, 0, 0.04)",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      minWidth: 0,
                      flex: 1,
                      mr: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        minWidth: 0,
                        width: "100%",
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: "medium",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          minWidth: { xs: "100px", sm: "150px" },
                          maxWidth: { xs: "150px", sm: "200px" },
                        }}
                      >
                        {type.type}
                      </Typography>

                      <Chip
                        label={`Level ${type.levelType}`}
                        size="small"
                        variant="outlined"
                        sx={{
                          minWidth: "80px",
                          flexShrink: 0,
                        }}
                      />
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      flexShrink: 0,
                    }}
                  >
                    <ServiceDialog
                      typeName={type.type}
                      mode="add"
                      onUpdate={handleUpdate}
                      typeId={type.id}
                    />
                    <EditCategoryDialog
                      serviceType={type}
                      onUpdate={handleUpdate}
                    />
                    <IconButton
                      onClick={() => toggleExpand(type.id)}
                      size="small"
                    >
                      {expandedTypes[type.id] ? (
                        <KeyboardArrowUp />
                      ) : (
                        <KeyboardArrowDown />
                      )}
                    </IconButton>
                  </Box>
                </Box>

                <Collapse in={expandedTypes[type.id]}>
                  <Box sx={{ p: 2 }}>
                    {type.serviceItems
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map((service, index) => (
                        <React.Fragment key={service.id}>
                          <Paper
                            elevation={0}
                            sx={{ 
                              py: 2,
                              backgroundColor: !service.active ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                              position: 'relative',
                              pr: 10,
                            }}
                          >
                            <Box sx={{ 
                              display: "flex", 
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              mb: 1,
                              opacity: service.active ? 1 : 0.7,
                              filter: !service.active ? 'grayscale(30%)' : 'none',
                              transition: 'all 0.2s ease-in-out',
                              position: 'relative',
                            }}>
                              <Box sx={{ flex: 1, mr: 2 }}>
                                <Typography 
                                  variant="subtitle1" 
                                  sx={{ 
                                    fontWeight: "medium",
                                    textDecoration: !service.active ? 'line-through' : 'none',
                                    color: !service.active ? 'text.secondary' : 'text.primary'
                                  }}
                                >
                                  {service.serviceName}
                                </Typography>
                                <ExpandableDescription 
                                  description={service.serviceDescription} 
                                  maxLength={100}
                                />
                              </Box>
                              <Box sx={{ 
                                position: 'absolute',
                                right: -48,
                                top: 0,
                              }}>
                                <ServiceDialog
                                  mode="edit"
                                  typeName={type.type}
                                  typeId={type.id}
                                  serviceItem={service}
                                  onUpdate={handleUpdate}
                                />
                              </Box>
                            </Box>

                            <Box sx={{ 
                              display: "flex", 
                              gap: 3,
                              mt: 1,
                              opacity: service.active ? 1 : 0.7
                            }}>
                              <Box sx={{ 
                                display: "flex", 
                                alignItems: "center",
                                gap: 0.5,
                                color: !service.active ? 'text.disabled' : 'text.secondary'
                              }}>
                                <AttachMoneyIcon fontSize="small" />
                                <Typography variant="body2">
                                  {service.servicePrice.toFixed(2)}
                                </Typography>
                              </Box>
                              <Box sx={{ 
                                display: "flex", 
                                alignItems: "center",
                                gap: 0.5,
                                color: !service.active ? 'text.disabled' : 'text.secondary'
                              }}>
                                <AccessTimeIcon fontSize="small" />
                                <Typography variant="body2">
                                  {service.estimatedTime} mins
                                </Typography>
                              </Box>
                            </Box>
                          </Paper>
                          {index < type.serviceItems.length - 1 && (
                            <Divider />
                          )}
                        </React.Fragment>
                      ))}
                    {type.serviceItems.length === 0 && (
                      <Box
                        sx={{
                          py: 4,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          flexDirection: "column",
                          gap: 2,
                          color: "text.secondary",
                        }}
                      >
                        <AddIcon fontSize="large" />
                        <Typography>No services added yet</Typography>
                      </Box>
                    )}
                  </Box>
                </Collapse>
              </Paper>
            </Fade>
          ))}

          {filteredServiceTypes.length === 0 && (
            <Box
              sx={{
                py: 8,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
                gap: 2,
                color: "text.secondary",
              }}
            >
              <Typography variant="h6">No service categories found</Typography>
              <Typography variant="body2">
                Start by adding a new service category
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default withAuth(ServiceTypePage);