import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  InputAdornment,
  TextField,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  Container,
  Fade,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Staff from "../components/Staff";
import { axiosInstance } from "../utils/axios";
import { useSelector } from "react-redux";
import { RootState } from "../redux toolkit/store";
import withAuth from "../components/HOC/withAuth";
import ErrorOverlayComponent from "../components/ErrorOverlayComponent";

interface Staff {
  id: number | null;
  firstName: string;
  lastName: string;
  nickname: string;
  phone: string;
  skillLevel: number | null;
  dateOfBirth: string;
  rate: number | null;
  workingDays: string;
  storeUuid: string;
  tenantUuid: string;
  isActive: boolean;
}

const StaffsPage: React.FC = () => {
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updateTrigger, setUpdateTrigger] = useState<boolean>(false);
  const [filter, setFilter] = useState<string>("true");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const selectedStoreId = useSelector(
    (state: RootState) => state.selectedStore.storeUuid
  );

  const fetchStaffs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get<Staff[]>(
        `/staff/?isOnlyActive=false`
      );
      setStaffs(response.data);
      setError(null);
    } catch (error) {
      setError("Error fetching data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaffs();
  }, [updateTrigger, selectedStoreId, fetchStaffs]);

  const handleUpdate = () => {
    setUpdateTrigger(!updateTrigger);
  };

  const handleFilterChange = (event: SelectChangeEvent<string>) => {
    setFilter(event.target.value);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredStaffs = staffs.filter((staff) => {
    const matchesFilter = filter === "true" ? staff.isActive : true;
    const matchesSearch = searchTerm
      ? `${staff.firstName} ${staff.lastName} ${staff.nickname}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      : true;
    return matchesFilter && matchesSearch;
  });

  const sortedStaffArray = filteredStaffs.sort(
    (a, b) => (a.id ?? 0) - (b.id ?? 0)
  );

  if (error) {
    return <ErrorOverlayComponent />;
  }

  const emptyForm: Staff = {
    id: null,
    firstName: "",
    lastName: "",
    nickname: "",
    phone: "",
    skillLevel: 1,
    dateOfBirth: "01/01/1990",
    rate: 1,
    workingDays: "",
    storeUuid: "",
    tenantUuid: "",
    isActive: true,
  };

  return (
    <Container maxWidth="xl" disableGutters={isMobile}>
      <Box sx={{ py: { xs: 2, sm: 4 } }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 2, sm: 3 }, 
            mb: { xs: 2, sm: 4 }, 
            borderRadius: { xs: 0, sm: 2 },
            ...(isMobile && { boxShadow: 'none' })
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: { xs: 1.5, sm: 2 },
              mb: { xs: 1.5, sm: 3 },
            }}
          >
            <Typography 
              variant={isMobile ? "h5" : "h4"} 
              component="h1" 
              sx={{ 
                fontWeight: "bold",
                fontSize: { xs: '1.25rem', sm: '2rem' }
              }}
            >
              Team Members ({sortedStaffArray.length})
            </Typography>
            
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
              }}
            >
              <TextField
                fullWidth
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search staff..."
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              
              <Box sx={{ 
                display: 'flex', 
                gap: 1.5,
                flexDirection: { xs: 'row', sm: 'row' },
                width: '100%'
              }}>
                <FormControl 
                  size="small" 
                  sx={{ 
                    flexGrow: 1,
                    maxWidth: { xs: '50%', sm: 200 }
                  }}
                >
                  <Select value={filter} onChange={handleFilterChange}>
                    <MenuItem value="true">Active Staff</MenuItem>
                    <MenuItem value="false">All Staff</MenuItem>
                  </Select>
                </FormControl>
                
                <Box sx={{ flexGrow: { xs: 1, sm: 0 } }}>
                  <Staff type="add" staff={emptyForm} onUpdate={handleUpdate} />
                </Box>
              </Box>
            </Box>
          </Box>
        </Paper>

        <Fade in={!loading}>
          <Grid 
            container 
            spacing={isMobile ? 1 : 3}
            sx={{ px: { xs: 1, sm: 0 } }}
          >
            {sortedStaffArray.map((staff) => (
              <Grid item xs={6} sm={6} md={4} lg={3} key={staff.id}>
                <Staff type="edit" staff={staff} onUpdate={handleUpdate} />
              </Grid>
            ))}
          </Grid>
        </Fade>

        {loading && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "30vh",
            }}
          >
            <Typography 
              variant={isMobile ? "body1" : "h6"} 
              color="text.secondary"
            >
              Loading staff members...
            </Typography>
          </Box>
        )}

        {!loading && sortedStaffArray.length === 0 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "30vh",
            }}
          >
            <Typography 
              variant={isMobile ? "body1" : "h6"} 
              color="text.secondary"
            >
              No staff members found
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default withAuth(StaffsPage);