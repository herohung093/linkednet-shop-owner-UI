import AddCategoryDialog from "../components/AddCategoryDialog";
import EditCategoryDialog from "../components/EditCategoryDialog";
import CustomLoading from "../components/Loading";
import { axiosWithToken } from "../utils/axios";
import { useCallback, useEffect, useState } from "react";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ServiceDialog from "../components/ServiceDialog";
import { MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { useSelector } from "react-redux";
import { RootState } from "../redux toolkit/store";
import withAuth from "../components/HOC/withAuth";

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
  const [visibleServiceType, setVisibleServiceType] = useState<number | null>(
    null
  );
  const sortedServiceType = serviceType.sort((a, b) => a.id - b.id);

  const fetchCategories = useCallback(async () => {
    // AuthCheck()
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
  const selectedStoreId = useSelector(
    (state: RootState) => state.selectedStore.storeUuid
  );

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories, updateTrigger, selectedStoreId]);

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

  const handleFilterChange = (event: SelectChangeEvent<string>) => {
    setFilterStatus(event.target.value);
  };

  const filteredServiceType = sortedServiceType.filter((service) =>
    filterStatus === "all"
      ? true
      : filterStatus === "active"
      ? service.active
      : !service.active
  );

  return (
    <div className="p-4 md:w-[80%] mx-auto max-w-[1024px]">
      <div className="mb-6 flex sm:justify-between justify-center items-center">
        <div className="hidden sm:block"></div>
        <div className="mb-6 flex justify-end sm:gap-x-8 ">
          <Select
            value={filterStatus}
            onChange={handleFilterChange}
            className="w-[110px] sm:w-[130px] h-[38px]"
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
          <AddCategoryDialog onUpdate={handleUpdate} />
        </div>
      </div>

      {filteredServiceType.map((serviceType) => (
        <div key={serviceType.id} className="mb-6 border-b border-black">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-bold">{serviceType.type}</h3>
            <div className="flex gap-5 justify-center items-center">
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
                typeName={serviceType.type}
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
              {serviceType.serviceItems.map((serviceItem, index) => (
                <div
                  key={serviceItem.id}
                  className={`mb-2 flex justify-between items-center  ${
                    index < serviceType.serviceItems.length - 1
                      ? "border-b "
                      : ""
                  }`}
                >
                  <div className="">
                    <h4 className="text-sm font-semibold">
                      {serviceItem.serviceName}
                    </h4>
                    <p className="text-sm mx-3">
                      {serviceItem.serviceDescription}
                    </p>
                    <p className="text-sm mx-3">
                      Price: ${serviceItem.servicePrice.toFixed(2)}
                    </p>
                    <p className="text-sm mx-3">
                      Estimated Time: {serviceItem.estimatedTime} mins
                    </p>
                    <p className="text-sm mx-3">
                      Active: {serviceItem.active ? "Yes" : "No"}
                    </p>
                  </div>
                  <ServiceDialog
                    mode="edit"
                    typeName={serviceType.type}
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

export default withAuth(ServiceTypePage);
