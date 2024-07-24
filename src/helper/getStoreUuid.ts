export const getStoreUuid = () => {
  console.log(localStorage.getItem("storeUuid"));

  return localStorage.getItem("storeUuid");
};
