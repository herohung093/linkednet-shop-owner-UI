import AddCategoryDialog from "../components/AddCategoryDialog";
import EditCategoryDialog from "../components/EditCategoryDialog";
import CustomLoading from "../components/Loading";
import isTokenExpired from "../helper/CheckTokenExpired";
import { refreshToken } from "../helper/RefreshToken";
import { getToken } from "../helper/getToken";
import { axiosWithToken } from "../utils/axios";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ServiceDialog from "../components/ServiceDialog";
import { MenuItem, Select, SelectChangeEvent } from "@mui/material"; // Import SelectChangeEvent

interface ServiceItem {
  id: number;
  serviceName: string;
  serviceDescription: string;
  servicePrice: number;
  estimatedTime: number;
  active: boolean;
}

interface ServiceType {
  id: number;
  type: string;
  levelType: number;
  description: string | null;
  storeUuid: string;
  active: boolean;
  tenantUuid: string;
  serviceItems: ServiceItem[];
}

const ServiceTypePage: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updateTrigger, setUpdateTrigger] = useState<boolean>(false);
  const [serviceType, setServiceType] = useState<ServiceType[]>([]);
  const [visibleServiceType, setVisibleServiceType] = useState<number | null>(null);
  const sortedServiceType = serviceType.sort((a, b) => a.id - b.id);
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem("authToken")) {
      const token = getToken();

      if (isTokenExpired(token)) {
        refreshToken();
      }
    } else {
      navigate("/session-expired");
    }
  }, [navigate]);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosWithToken.get<ServiceType[]>(`/serviceType/`);
      console.log(response.data);

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
  }, [fetchCategories, updateTrigger]);

  if (loading) return <CustomLoading />;
  if (error) return <div>Error</div>;

  const handleUpdate = () => {
    setUpdateTrigger(!updateTrigger);
  };

  const toggleServiceVisibility = (id: number) => {
    setVisibleServiceType((prevVisibleServiceType) =>
      prevVisibleServiceType === id ? null : id
    );
  };

  // Updated handler for dropdown change
  const handleFilterChange = (event: SelectChangeEvent<string>) => {
    setFilterStatus(event.target.value);
  };

  // Filtered service types based on filterStatus
  const filteredServiceType = sortedServiceType.filter(service =>
    filterStatus === "all" ? true : (filterStatus === "active" ? service.active : !service.active)
  );

  return (
    <div className="p-4 md:w-[80%] mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold mb-2">Service Type Name</h2>
      {/* Dropdown Filter */}
      <div className="mb-6 flex justify-end">
        <Select
          value={filterStatus}
          onChange={handleFilterChange}
          className="w-[110px] h-[38px]"
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </Select>
        <AddCategoryDialog onUpdate={handleUpdate} />
      </div>
      </div>


      {filteredServiceType.map((serviceType) => (
        <div key={serviceType.id} className="mb-6 border-b-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-bold">{serviceType.type}</h3>
            <div className="flex gap-5">
              {visibleServiceType === serviceType.id ? (
                <ArrowDropUpIcon
                  className="cursor-pointer"
                  onClick={() => toggleServiceVisibility(serviceType.id)}
                />
              ) : (
                <ArrowDropDownIcon
                  className="cursor-pointer"
                  onClick={() => toggleServiceVisibility(serviceType.id)}
                />
              )}
              <ServiceDialog
                mode="add"
                onUpdate={handleUpdate}
                typeId={serviceType.id}
              />
              <EditCategoryDialog
                serviceType={serviceType}
                onUpdate={handleUpdate}
              />
            </div>
          </div>
          {visibleServiceType === serviceType.id && (
            <div className="ml-4">
              {serviceType.serviceItems.map((serviceItem) => (
                <div
                  key={serviceItem.id}
                  className="mb-2 flex justify-between items-center"
                >
                  <div>
                    <h4 className="text-sm font-semibold">
                      {serviceItem.serviceName}
                    </h4>
                    <p className="text-sm">{serviceItem.serviceDescription}</p>
                    <p className="text-sm">
                      Price: ${serviceItem.servicePrice.toFixed(2)}
                    </p>
                    <p className="text-sm">
                      Estimated Time: {serviceItem.estimatedTime} mins
                    </p>
                    <p className="text-sm">
                      Active: {serviceItem.active ? "Yes" : "No"}
                    </p>
                  </div>
                  <ServiceDialog
                    mode="edit"
                    typeId={serviceType.id}
                    serviceItem={serviceItem}
                    onUpdate={handleUpdate}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ServiceTypePage;
