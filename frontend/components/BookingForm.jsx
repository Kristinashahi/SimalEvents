import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getAuthData } from "../src/utils/auth-utils.js";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-hot-toast";
import "../src/styles/BookingForm.css";
import { FiCalendar, FiClock, FiUsers, FiDollarSign, FiEdit2, FiCheck } from "react-icons/fi";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const TIME_PERIODS = [
  { id: "morning", name: "Morning", time: "7:00 AM - 11:00 AM" },
  { id: "day", name: "Day", time: "12:00 PM - 4:00 PM" },
  { id: "evening", name: "Evening", time: "5:00 PM - 9:00 PM" },
];

const BookingForm = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPeriods, setSelectedPeriods] = useState([]);
  const [specialRequests, setSpecialRequests] = useState("");
  const [error, setError] = useState(null);
  const [bookedPeriods, setBookedPeriods] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null); // Holds the currently selected package
  const [guestCount, setGuestCount] = useState(1);
  const [includeCatering, setIncludeCatering] = useState(false);
  const [selectedMenuItems, setSelectedMenuItems] = useState({}); // Tracks selected menu items

  const fetchService = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/services/${serviceId}`);
  
      if (!response.data) {
        throw new Error("Service not found");
      }
  
      setService(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching service:", err);
      setError(
        err.response?.status === 404
          ? "Service not found. It may have been removed."
          : "Failed to load service details. Please try again."
      );
      toast.error("Service not found");
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  const fetchBookedPeriods = useCallback(async () => {
    if (!selectedDate || !serviceId) return;

    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const response = await axios.get(
        `${API_BASE_URL}/api/bookings/availability/${serviceId}?date=${dateStr}`
      );
      setBookedPeriods(response.data?.bookedPeriods || []);
    } catch (err) {
      console.error("Error fetching booked periods:", err);
    }
  }, [selectedDate, serviceId]);

  useEffect(() => {
    fetchService();
  }, [fetchService]);

  useEffect(() => {
    fetchBookedPeriods();
  }, [fetchBookedPeriods]);

  useEffect(() => {
    if (selectedPeriods.length > 0) {
      const checkAvailability = async () => {
        try {
          const dateStr = selectedDate.toISOString().split("T")[0];
          const response = await axios.get(
            `${API_BASE_URL}/api/bookings/availability/${serviceId}?date=${dateStr}`
          );

          const newlyBooked = response.data?.bookedPeriods || [];
          setBookedPeriods(newlyBooked);

          const conflicts = selectedPeriods.filter((p) => newlyBooked.includes(p));
          if (conflicts.length > 0) {
            setSelectedPeriods((prev) => prev.filter((p) => !conflicts.includes(p)));

            const conflictNames = conflicts
              .map((pid) => {
                const period = TIME_PERIODS.find((p) => p.id === pid);
                return period ? `${period.name} (${period.time})` : pid;
              })
              .join(", ");

            setError(`These periods were just booked by someone else: ${conflictNames}`);
          }
        } catch (err) {
          console.error("Error checking availability:", err);
        }
      };

      checkAvailability();
    }
  }, [selectedDate, selectedPeriods, serviceId]);

  const handlePeriodSelection = (periodId) => {
    setSelectedPeriods((prev) =>
      prev.includes(periodId) ? prev.filter((p) => p !== periodId) : [...prev, periodId]
    );
  };

  const handlePackageSelection = (pkg) => {
    const isSelected = selectedPackage?._id === pkg._id;
    setSelectedPackage(isSelected ? null : pkg);
    setSelectedMenuItems({});
    console.log("Selected Package:", isSelected ? null : pkg);
  };

  const handleMenuItemSelection = (itemId, isSelected, isOptional = false) => {
    setSelectedMenuItems((prev) => {
      const newSelection = { ...prev };

      if (isOptional) {
        if (isSelected) {
          newSelection[itemId] = (newSelection[itemId] || 0) + 1;
        } else {
          if (newSelection[itemId] > 0) {
            newSelection[itemId] -= 1;
            if (newSelection[itemId] === 0) {
              delete newSelection[itemId];
            }
          }
        }
      } else {
        if (isSelected) {
          newSelection[itemId] = 1;
        } else {
          delete newSelection[itemId];
        }
      }

      return newSelection;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (selectedPeriods.length === 0) {
      setError("Please select at least one time period");
      return;
    }
  
    if (includeCatering && !selectedPackage) {
      setError("Please select a catering package");
      return;
    }
  
    try {
      const { token } = getAuthData();
  
      // Format selected items differently for menu sections
      const selectedItems = Object.entries(selectedMenuItems).map(([itemId, quantity]) => {
        // Check if this is a menu section item (has the x-y-z format)
        if (itemId.includes('-')) {
          return {
            menuItemId: itemId,
            quantity,
            isOptional: true, // Treat all section items as optional
            isSectionItem: true // Add flag for section items
          };
        } else {
          return {
            menuItemId: itemId,
            quantity,
            isOptional: selectedPackage?.optionalItems?.some((opt) => opt.menuItemId === itemId) || false
          };
        }
      });
  
      const response = await axios.post(
        `${API_BASE_URL}/api/bookings`,
        {
          serviceId,
          date: selectedDate,
          periods: selectedPeriods,
          specialRequests,
          cateringPackage: includeCatering
            ? {
                packageId: selectedPackage._id,
                selectedItems,
                guestCount,
              }
            : null,
          totalPrice: calculateTotalPrice(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      toast.success("Booking created successfully!");
      navigate("/user-dashboard", { state: { activeTab: "bookings" } });
    } catch (err) {
      if (err.response?.status === 409) {
        const { conflictingPeriods } = err.response.data;
        setBookedPeriods((prev) => [...new Set([...prev, ...conflictingPeriods])]);
        setSelectedPeriods((prev) => prev.filter((p) => !conflictingPeriods.includes(p)));

        const periodNames = conflictingPeriods
          .map((pid) => {
            const period = TIME_PERIODS.find((p) => p.id === pid);
            return period ? `${period.name} (${period.time})` : pid;
          })
          .join(", ");

        setError(`The following time periods are no longer available: ${periodNames}. Please select different times.`);
        toast.error("Some selected periods are no longer available");
      } else {
        const errorMsg = err.response?.data?.message || "Failed to create booking";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    }
  };

  const calculateTotalPrice = () => {
    if (!service || !selectedPeriods.length) return 0;

    const basePrice = service.price * selectedPeriods.length;
    let cateringPrice = 0;

    if (includeCatering && selectedPackage) {
      cateringPrice = selectedPackage.basePrice * guestCount;

      Object.entries(selectedMenuItems).forEach(([itemId, quantity]) => {
        const menuItem = service.cateringMenu.find((item) => item._id === itemId);
        if (menuItem && menuItem.price > 0) {
          cateringPrice += menuItem.price * quantity;
        }
      });
    }

    return basePrice + cateringPrice;
  };

  if (loading) {
    return (
      <div className="booking-loading">
        <div className="spinner"></div>
        <p>Loading booking details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="booking-error">
        <p>{error}</p>
        <button className="primary-btn" onClick={() => navigate("/services")}>
          Back to Services
        </button>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="booking-error">
        <p>Service not found</p>
        <button className="primary-btn" onClick={() => navigate("/services")}>
          Browse Services
        </button>
      </div>
    );
  }

  return (
    <div className="booking-container">
      <div className="booking-card">
        <div className="booking-header">
          <h2>Book {service.name}</h2>
        </div>

        <form onSubmit={handleSubmit} className="booking-form">
          <div className="form-section">
            <h3>
              <FiCalendar /> Select Date
            </h3>
            <DatePicker
              selected={selectedDate}
              onChange={(date) => {
                setSelectedDate(date);
                setSelectedPeriods([]);
              }}
              minDate={new Date()}
              className="date-picker"
              required
            />
          </div>

          <div className="form-section">
            <h3>
              <FiClock /> Available Time Periods
            </h3>
            <div className="periods-grid">
              {TIME_PERIODS.map((period) => {
                const isBooked = bookedPeriods.includes(period.id);
                const isSelected = selectedPeriods.includes(period.id);
                return (
                  <button
                    key={period.id}
                    type="button"
                    className={`period-btn ${isBooked ? "booked" : ""} ${isSelected ? "selected" : ""}`}
                    onClick={() => !isBooked && handlePeriodSelection(period.id)}
                    disabled={isBooked}
                  >
                    <div>
                      <strong>{period.name}</strong>
                      <div className="period-time">{period.time}</div>
                      {isBooked && <span className="booked-badge">Booked</span>}
                      {isSelected && <FiCheck className="selected-icon" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {service.category === "venue" && service.hasCatering && (
            <>
              <div className="form-section">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={includeCatering}
                    onChange={() => {
                      setIncludeCatering(!includeCatering);
                      setSelectedPackage(null);
                      setSelectedMenuItems({});
                    }}
                  />
                  <span className="slider"></span>
                  <span className="toggle-label">
                    <FiUsers /> Include Catering Service
                  </span>
                </label>
              </div>

              {includeCatering && (
                <>
                  <div className="form-section">
                    <label>
                      <FiUsers /> Number of Guests
                    </label>
                    <input
                      type="number"
                      value={guestCount}
                      onChange={(e) => setGuestCount(Math.max(1, Number(e.target.value)))}
                      min="1"
                      required
                    />
                    {selectedPackage && (
                      <small className="form-text text-muted">
                        (Min: {selectedPackage.minGuests}, Max: {selectedPackage.maxGuests})
                      </small>
                    )}
                  </div>

                  {service.cateringPackages?.length > 0 && (
                    <div className="form-section">
                      <h3>Catering Packages</h3>
                      <div className="packages-grid">
                        {service.cateringPackages.map((pkg, index) => {
                          const period = TIME_PERIODS.find((p) => p.id === pkg.period);
                          const isSelected = selectedPackage?._id === pkg._id;
                          console.log(
                            `Package ${pkg.name} (ID: ${pkg._id}) - isSelected: ${isSelected}`
                          );

                          return (
                            <div
                              key={pkg._id || `pkg-${index}`} // Fallback to index if _id is missing
                              className={`package-card ${isSelected ? "selected" : ""}`}
                              onClick={() => handlePackageSelection(pkg)}
                            >
                              <div className="package-header">
                                <h4>{pkg.name}</h4>
                                {isSelected && (
                                  <span className="selected-badge">Selected</span>
                                )}
                              </div>
                              <div className="package-price">
                                <span>NPR {pkg.basePrice} per plate</span>
                              </div>
                              {period && (
                                <p className="package-time">
                                  {period.name} ({period.time})
                                </p>
                              )}
                              <p className="package-description">{pkg.description}</p>
                              <p className="package-guests">
                                {pkg.minGuests}-{pkg.maxGuests} guests
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {selectedPackage && (
                    <>
                      <div className="form-section">
                        <h4>Menu Items</h4>
                        {console.log("Selected Package:", selectedPackage)}

                        {selectedPackage.includedItems?.length > 0 && (
                          <div className="menu-section">
                            <h5>Included in Package:</h5>
                            <ul className="menu-items-list">
                              {selectedPackage.includedItems.map((item, idx) => {
                                const menuItem = service.cateringMenu.find(
                                  (mi) => mi._id === item.menuItemId
                                );
                                if (!menuItem) return null;

                                const isSelected = selectedMenuItems[item.menuItemId] > 0;

                                return (
                                  <li key={`included-${idx}`}>
                                    <label>
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) =>
                                          handleMenuItemSelection(
                                            item.menuItemId,
                                            e.target.checked,
                                            false
                                          )
                                        }
                                      />
                                      <span className="item-name">{menuItem.name}</span>
                                      {menuItem.price > 0 && (
                                        <span className="item-price">
                                          + NPR {menuItem.price}
                                        </span>
                                      )}
                                      {menuItem.description && (
                                        <p className="item-description">{menuItem.description}</p>
                                      )}
                                    </label>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}

                        {selectedPackage.optionalItems?.length > 0 && (
                          <div className="menu-section">
                            <h5>Optional Items (Choose up to):</h5>
                            <ul className="menu-items-list">
                              {selectedPackage.optionalItems.map((item, idx) => {
                                const menuItem = service.cateringMenu.find(
                                  (mi) => mi._id === item.menuItemId
                                );
                                if (!menuItem) return null;

                                const currentQty = selectedMenuItems[item.menuItemId] || 0;
                                const maxAllowed =
                                  item.maxSelection > 0 ? item.maxSelection : Infinity;

                                return (
                                  <li key={`optional-${idx}`}>
                                    <div className="item-controls">
                                      <button
                                        type="button"
                                        className="qty-btn"
                                        onClick={() =>
                                          handleMenuItemSelection(item.menuItemId, true, true)
                                        }
                                        disabled={currentQty >= maxAllowed}
                                      >
                                        +
                                      </button>
                                      <span className="item-qty">{currentQty}</span>
                                      <button
                                        type="button"
                                        className="qty-btn"
                                        onClick={() =>
                                          handleMenuItemSelection(item.menuItemId, false, true)
                                        }
                                        disabled={currentQty <= 0}
                                      >
                                        -
                                      </button>
                                      <span className="item-name">{menuItem.name}</span>
                                      {menuItem.price > 0 && (
                                        <span className="item-price">
                                          + NPR {menuItem.price} each
                                        </span>
                                      )}
                                      {item.maxSelection > 0 && (
                                        <span className="item-limit">
                                          (Max {item.maxSelection})
                                        </span>
                                      )}
                                    </div>
                                    {menuItem.description && (
                                      <p className="item-description">{menuItem.description}</p>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}

                        {selectedPackage.menuSections?.length > 0 && (
                          <div className="menu-section">
                            <h5>Menu Sections:</h5>
                            {selectedPackage.menuSections.map((section, sectionIndex) => (
                              <div key={`section-${sectionIndex}`}>
                                <h6>{section.name}</h6>
                                {section.items.map((itemGroup, itemGroupIndex) => {
                                  const match = itemGroup.title.match(/Any (\w+)/);
                                  const maxSelection = match
                                    ? parseInt(match[1], 10) || Infinity
                                    : Infinity;
                                  const selectedInGroup = itemGroup.items.reduce(
                                    (count, item, idx) => {
                                      const key = `${sectionIndex}-${itemGroupIndex}-${idx}`;
                                      return count + (selectedMenuItems[key] ? 1 : 0);
                                    },
                                    0
                                  );

                                  return (
                                    <div
                                      key={`section-${sectionIndex}-group-${itemGroupIndex}`}
                                      className="mb-3"
                                    >
                                      <p className="fst-italic">{itemGroup.title}</p>
                                      {maxSelection !== Infinity && (
                                        <small className="text-muted">
                                          (Select up to {maxSelection} items. Currently selected: {selectedInGroup})
                                        </small>
                                      )}
                                      <ul className="menu-items-list">
                                        {itemGroup.items.map((item, itemIndex) => {
                                          const key = `${sectionIndex}-${itemGroupIndex}-${itemIndex}`;
                                          const isDisabled =
                                            selectedInGroup >= maxSelection &&
                                            !selectedMenuItems[key];
                                          return (
                                            <li key={`item-${itemIndex}`} className="menu-item">
                                              <div className="form-check">
                                                <input
                                                  type="checkbox"
                                                  className="form-check-input"
                                                  id={`menu-item-${key}`}
                                                  checked={!!selectedMenuItems[key]}
                                                  onChange={() => {
                                                    setSelectedMenuItems((prev) => ({
                                                      ...prev,
                                                      [key]: prev[key] ? 0 : 1,
                                                    }));
                                                  }}
                                                  disabled={isDisabled}
                                                />
                                                <label
                                                  className="form-check-label"
                                                  htmlFor={`menu-item-${key}`}
                                                >
                                                  {item}
                                                </label>
                                              </div>
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}

          <div className="form-section">
            <h3>Booking Summary</h3>
            <div className="summary-card">
              <div className="summary-row">
                <span>Service:</span>
                <span>
                  {service.name} (NPR {service.price}/period)
                </span>
              </div>

              <div className="summary-row">
                <span>Selected periods ({selectedPeriods.length}):</span>
                <span>NPR {service.price * selectedPeriods.length}</span>
              </div>

              {includeCatering && selectedPackage && (
                <>
                  <div className="summary-row">
                    <span>Catering Package:</span>
                    <span>{selectedPackage.name}</span>
                  </div>
                  <div className="summary-row">
                    <span>
                      {guestCount} guests × NPR {selectedPackage.basePrice}
                    </span>
                    <span>NPR {selectedPackage.basePrice * guestCount}</span>
                  </div>

                  {Object.entries(selectedMenuItems).map(([itemId, quantity]) => {
                    const menuItem = service.cateringMenu.find((item) => item._id === itemId);
                    if (!menuItem || menuItem.price <= 0) return null;

                    return (
                      <div key={`summary-item-${itemId}`} className="summary-row">
                        <span>
                          {menuItem.name} (x{quantity})
                        </span>
                        <span>NPR {menuItem.price * quantity}</span>
                      </div>
                    );
                  })}
                </>
              )}

              <div className="summary-divider"></div>
              <div className="summary-row total">
                <span>Total:</span>
                <span>NPR {calculateTotalPrice()}</span>
              </div>
            </div>
          </div>

          <div className="form-section">
            <label>
              <FiEdit2 /> Special Requests (Optional)
            </label>
            <textarea
              rows="3"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="primary-btn confirm-btn">
            Confirm Booking
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;