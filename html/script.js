window.addEventListener("message", function (event) {
    const data = event.data;
    if (data.action === "VehicleList") {
        const garageLabel = data.garageLabel;
        const vehicles = data.vehicles;
        populateVehicleList(garageLabel, vehicles);
        displayUI();
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeGarageMenu();
    }
});

function closeGarageMenu() {
    const container = document.querySelector(".container");
    container.classList.remove("visible");
    
    setTimeout(() => {
        container.style.display = "none";
        
        fetch("https://qb-garages/closeGarage", {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=UTF-8",
            },
            body: JSON.stringify({}),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data !== "ok") {
                    console.error("Failed to close Garage UI");
                }
            });
    }, 300);
}

function displayUI() {
    const container = document.querySelector(".container");
    container.style.display = "block";
    requestAnimationFrame(() => {
        container.classList.add("visible");
    });
}

function populateVehicleList(garageLabel, vehicles) {
    const vehicleContainerElem = document.querySelector(".vehicle-table");
    const fragment = document.createDocumentFragment();

    while (vehicleContainerElem.firstChild) {
        vehicleContainerElem.removeChild(vehicleContainerElem.firstChild);
    }

    const garageHeader = document.getElementById("garage-header");
    garageHeader.textContent = garageLabel;

    vehicles.forEach((v) => {
        const vehicleItem = document.createElement("div");
        vehicleItem.classList.add("vehicle-item");

        const vehicleInfo = document.createElement("div");
        vehicleInfo.classList.add("vehicle-info");

        const vehicleName = document.createElement("span");
        vehicleName.classList.add("vehicle-name");
        vehicleName.textContent = v.vehicleLabel;
        vehicleInfo.appendChild(vehicleName);

        const plate = document.createElement("span");
        plate.classList.add("plate");
        plate.textContent = v.plate;
        vehicleInfo.appendChild(plate);

        const mileage = document.createElement("span");
        mileage.classList.add("mileage");
        mileage.textContent = `${v.distance}mi`;
        vehicleInfo.appendChild(mileage);

        vehicleItem.appendChild(vehicleInfo);

        const stats = document.createElement("div");
        stats.classList.add("stats");

        const maxValues = {
            fuel: 100,
            engine: 1000,
            body: 1000,
        };

        ["fuel", "engine", "body"].forEach((statLabel) => {
            const stat = document.createElement("div");
            stat.classList.add("stat");
            
            const label = document.createElement("div");
            label.classList.add("label");
            label.textContent = statLabel.charAt(0).toUpperCase() + statLabel.slice(1);
            stat.appendChild(label);
            
            const progressBar = document.createElement("div");
            progressBar.classList.add("progress-bar");
            
            const progress = document.createElement("span");
            const progressText = document.createElement("span");
            progressText.classList.add("progress-text");
            
            const percentage = (v[statLabel] / maxValues[statLabel]) * 100;
            progress.style.width = "0%";
            progressText.textContent = Math.round(percentage) + "%";

            if (percentage >= 75) {
                progress.classList.add("bar-green");
            } else if (percentage >= 50) {
                progress.classList.add("bar-yellow");
            } else {
                progress.classList.add("bar-red");
            }

            progressBar.appendChild(progressText);
            progressBar.appendChild(progress);
            stat.appendChild(progressBar);
            stats.appendChild(stat);
            
            setTimeout(() => {
                progress.style.width = percentage + "%";
            }, 100 + Math.random() * 300);
        });
        
        vehicleItem.appendChild(stats);

        const financeDriveContainer = document.createElement("div");
        financeDriveContainer.classList.add("finance-drive-container");
        
        const financeInfo = document.createElement("div");
        financeInfo.classList.add("finance-info");

        if (v.balance && v.balance > 0) {
            financeInfo.textContent = "$" + v.balance.toFixed(0);
        } else {
            financeInfo.textContent = "Paid Off";
        }

        financeDriveContainer.appendChild(financeInfo);

        let status;
        let isDepotPrice = false;

        if (v.state === 0) {
            if (v.depotPrice && v.depotPrice > 0) {
                isDepotPrice = true;

                if (v.type === "public") {
                    status = "Depot";
                } else if (v.type === "depot") {
                    status = "$" + v.depotPrice.toFixed(0);
                } else {
                    status = "Track";
                }
            } else {
                status = "Track";
            }
        } else if (v.state === 1) {
            if (v.depotPrice && v.depotPrice > 0) {
                isDepotPrice = true;

                if (v.type === "depot") {
                    status = "$" + v.depotPrice.toFixed(0);
                } else if (v.type === "public") {
                    status = "Depot";
                } else {
                    status = "Drive";
                }
            } else {
                status = "Drive";
            }
        } else if (v.state === 2) {
            status = "Impound";
        }

        const driveButton = document.createElement("button");
        driveButton.classList.add("drive-btn");
        driveButton.textContent = status;

        if (status === "Depot" || status === "Impound") {
            driveButton.disabled = true;
        }

        driveButton.onclick = function () {
            if (driveButton.disabled) return;
            
            driveButton.style.transform = "scale(0.95)";
            setTimeout(() => {
                driveButton.style.transform = "scale(1)";
            }, 100);

            const vehicleStats = {
                fuel: v.fuel,
                engine: v.engine,
                body: v.body,
            };

            const vehicleData = {
                vehicle: v.vehicle,
                garage: v.garage,
                index: v.index,
                plate: v.plate,
                type: v.type,
                depotPrice: v.depotPrice,
                stats: vehicleStats,
            };

            if (status === "Track") {
                fetch("https://qb-garages/trackVehicle", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json; charset=UTF-8",
                    },
                    body: JSON.stringify(v.plate),
                })
                    .then((response) => response.json())
                    .then((data) => {
                        if (data === "ok") {
                            closeGarageMenu();
                        }
                    });
            } else if (isDepotPrice) {
                fetch("https://qb-garages/takeOutDepo", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json; charset=UTF-8",
                    },
                    body: JSON.stringify(vehicleData),
                })
                    .then((response) => response.json())
                    .then((data) => {
                        if (data === "ok") {
                            closeGarageMenu();
                        }
                    });
            } else {
                fetch("https://qb-garages/takeOutVehicle", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json; charset=UTF-8",
                    },
                    body: JSON.stringify(vehicleData),
                })
                    .then((response) => response.json())
                    .then((data) => {
                        if (data === "ok") {
                            closeGarageMenu();
                        }
                    });
            }
        };

        financeDriveContainer.appendChild(driveButton);
        vehicleItem.appendChild(financeDriveContainer);

        fragment.appendChild(vehicleItem);
    });

    vehicleContainerElem.appendChild(fragment);
}