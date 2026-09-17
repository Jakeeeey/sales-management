export async function fetchRoles() {
    const response = await fetch("/api/sales-management/target-setting/roles");
    const data = await response.json();
    return data.roles;
}
