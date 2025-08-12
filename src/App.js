import React, { useState, useEffect, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// --- Local Storage Utility ---
const LOCAL_STORAGE_KEY = 'laserAppProductionData';

const storage = {
  load: () => {
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedData) {
        return JSON.parse(storedData);
      }
    } catch (error) {
      console.error("Error loading data from local storage:", error);
    }
    // Return default structure if nothing is stored or an error occurs
    return {
      items: [],
      machines: [{ id: 'default-machine-1', name: 'Laser Cutter' }], // Start with one machine
      orders: [],
      schedule: null,
      settings: { workHours: 8, workdayStartHour: 9 },
    };
  },
  save: (data) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving data to local storage:", error);
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing data from local storage:", error);
    }
  }
};

// --- Helper Components ---
const Icon = ({ path, className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);

const Modal = ({ children, onClose, showCloseButton = true }) => (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md m-4 border border-gray-700 transform transition-all duration-300 scale-95 animate-fade-in-up">
            {showCloseButton && (
                <div className="flex justify-end absolute top-4 right-4">
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <Icon path="M6 18L18 6M6 6l12 12" />
                    </button>
                </div>
            )}
            {children}
        </div>
    </div>
);

const AlertModal = ({ title, message, onClose }) => (
    <Modal onClose={onClose} showCloseButton={false}>
        <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-4">{title || "Notification"}</h3>
            <p className="text-gray-300 mb-6 whitespace-pre-wrap">{message}</p>
            <button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105">
                OK
            </button>
        </div>
    </Modal>
);

const ConfirmationModal = ({ message, onConfirm, onCancel }) => (
    <Modal onClose={onCancel} showCloseButton={false}>
        <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-4">Are you sure?</h3>
            <p className="text-gray-300 mb-6">{message}</p>
            <div className="flex justify-center gap-4">
                <button onClick={onCancel} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105">
                    Cancel
                </button>
                <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105">
                    Confirm
                </button>
            </div>
        </div>
    </Modal>
);


// --- Main App Component ---
function App() {
    const [activeTab, setActiveTab] = useState('Daily Planner');
    const [data, setData] = useState(storage.load());

    // Persist data to local storage whenever it changes
    useEffect(() => {
        storage.save(data);
    }, [data]);

    // Handlers to update state from child components
    const handleSetItems = (newItems) => setData(prev => ({ ...prev, items: newItems }));
    const handleSetMachines = (newMachines) => setData(prev => ({ ...prev, machines: newMachines }));
    const handleSetOrders = (newOrders) => setData(prev => ({ ...prev, orders: newOrders, schedule: null })); // Invalidate schedule on order change
    const handleSetSchedule = (newSchedule) => setData(prev => ({ ...prev, schedule: newSchedule }));
    const handleSetSettings = (newSettings) => setData(prev => ({ ...prev, settings: newSettings }));

    const handleClearData = () => {
        storage.clear();
        window.location.reload(); // Easiest way to reset the app state
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'Daily Planner':
                return <DailyPlanner
                            items={data.items}
                            orders={data.orders}
                            onSetOrders={handleSetOrders}
                            onGenerateSchedule={handleSetSchedule}
                        />;
            case 'Item Library':
                return <ItemLibrary
                            items={data.items}
                            machines={data.machines}
                            onSetItems={handleSetItems}
                        />;
            case 'Machines':
                return <MachineLibrary
                            machines={data.machines}
                            onSetMachines={handleSetMachines}
                        />;
            case 'Schedule View':
                return <ScheduleView
                            scheduleOrders={data.schedule?.orders}
                            items={data.items}
                            machines={data.machines}
                            settings={data.settings}
                        />;
            case 'Settings':
                return <Settings
                            settings={data.settings}
                            onSetSettings={handleSetSettings}
                            onClearData={handleClearData}
                        />;
            default:
                return <DailyPlanner items={data.items} orders={data.orders} onSetOrders={handleSetOrders} onGenerateSchedule={handleSetSchedule} />;
        }
    };

    const tabs = ['Daily Planner', 'Item Library', 'Machines', 'Schedule View', 'Settings'];

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="bg-gray-900 text-white min-h-screen font-sans flex flex-col">
                <header className="bg-gray-800/50 backdrop-blur-xl border-b border-gray-700 p-4 sticky top-0 z-40">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <Icon path="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" className="w-8 h-8 text-indigo-400" />
                            <h1 className="text-2xl font-bold tracking-tight">Order Priority Calculator</h1>
                        </div>
                        <div className="hidden md:flex items-center space-x-1 bg-gray-700/50 p-1 rounded-lg">
                            {tabs.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === tab ? 'bg-indigo-600 shadow-lg' : 'text-gray-300 hover:bg-gray-600/50'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                <main className="flex-grow p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        {renderContent()}
                    </div>
                </main>

                <footer className="text-center p-4 text-xs text-gray-500 border-t border-gray-800">
                    <p>Shop Scheduler Dashboard</p>
                </footer>

                 <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-2 flex justify-around z-40">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 w-full ${activeTab === tab ? 'text-indigo-400' : 'text-gray-400 hover:bg-gray-700'}`}
                        >
                            <span className="text-xs text-center">{tab}</span>
                        </button>
                    ))}
                </div>
            </div>
        </DndProvider>
    );
}


// --- Item Library Component ---
function ItemLibrary({ items, machines, onSetItems }) {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [alertInfo, setAlertInfo] = useState({ show: false, message: '' });

    const handleSaveItem = (itemData) => {
        if (editingItem && editingItem.id) {
            // Update existing item
            const updatedItems = items.map(i => i.id === editingItem.id ? { ...i, ...itemData } : i);
            onSetItems(updatedItems);
        } else {
            // Add new item
            const newItem = { ...itemData, id: `item-${Date.now()}` };
            onSetItems([...items, newItem]);
        }
        setIsFormModalOpen(false);
        setEditingItem(null);
    };

    const confirmDeleteItem = (id) => {
        setItemToDelete(id);
        setShowConfirmModal(true);
    };

    const handleDeleteItem = () => {
        if (!itemToDelete) return;
        const updatedItems = items.filter(i => i.id !== itemToDelete);
        onSetItems(updatedItems);
        setShowConfirmModal(false);
        setItemToDelete(null);
    };

    const openModalForEdit = (item) => {
        setEditingItem(item);
        setIsFormModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">Item Library</h2>
                <div className="flex gap-2">
                    <button onClick={() => { setEditingItem(null); setIsFormModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-transform transform hover:scale-105">
                        <Icon path="M12 4.5v15m7.5-7.5h-15" />
                        <span>Add Item</span>
                    </button>
                </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-700">
                            <th className="p-3">Name</th>
                            <th className="p-3">Build Time (min)</th>
                            <th className="p-3">Profit ($)</th>
                            <th className="p-3">Allowed Machines</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length > 0 ? items.map(item => (
                            <tr key={item.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                                <td className="p-3 font-medium">{item.name}</td>
                                <td className="p-3">{item.buildTime}</td>
                                <td className="p-3 text-green-400">${(parseFloat(item.price || 0) - parseFloat(item.cost || 0)).toFixed(2)}</td>
                                <td className="p-3">{item.allowedMachines?.join(', ')}</td>
                                <td className="p-3 flex space-x-2">
                                    <button onClick={() => openModalForEdit(item)} className="text-gray-400 hover:text-indigo-400"><Icon path="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></button>
                                    <button onClick={() => confirmDeleteItem(item.id)} className="text-gray-400 hover:text-red-500"><Icon path="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="5" className="p-4 text-center text-gray-500">No items in library. Add one to get started.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            {isFormModalOpen && <ItemForm onClose={() => setIsFormModalOpen(false)} onSave={handleSaveItem} item={editingItem} machines={machines} />}
            {showConfirmModal && <ConfirmationModal message="Are you sure you want to delete this item?" onConfirm={handleDeleteItem} onCancel={() => setShowConfirmModal(false)} />}
            {alertInfo.show && <AlertModal message={alertInfo.message} onClose={() => setAlertInfo({ show: false, message: '' })} />}
        </div>
    );
}

function ItemForm({ onClose, onSave, item, machines }) {
    const [formData, setFormData] = useState({
        name: item?.name || '',
        buildTime: item?.buildTime || '',
        price: item?.price || '',
        cost: item?.cost || '',
        allowedMachines: item?.allowedMachines || [],
    });
    const [alertMessage, setAlertMessage] = useState('');

    const handleMachineToggle = (machineName) => {
        setFormData(prev => ({
            ...prev,
            allowedMachines: prev.allowedMachines.includes(machineName)
                ? prev.allowedMachines.filter(m => m !== machineName)
                : [...prev.allowedMachines, machineName]
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name || !formData.buildTime || !formData.price || !formData.cost) {
            setAlertMessage("Please fill out all fields.");
            return;
        }
        if (formData.allowedMachines.length === 0) {
            setAlertMessage("Please select at least one machine for this item.");
            return;
        }
        onSave(formData);
    };

    return (
        <>
            <Modal onClose={onClose}>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <h3 className="text-2xl font-bold text-white mt-6">{item?.id ? 'Edit Item' : 'Add New Item'}</h3>
                    <input type="text" placeholder="Item Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full bg-gray-700 p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input type="number" step="any" placeholder="Build Time (min)" value={formData.buildTime} onChange={e => setFormData({...formData, buildTime: e.target.value})} required className="w-full bg-gray-700 p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        <input type="number" step="any" placeholder="Price ($)" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required className="w-full bg-gray-700 p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        <input type="number" step="any" placeholder="Cost ($)" value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} required className="w-full bg-gray-700 p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Allowed Machines</h4>
                        <div className="flex flex-wrap gap-2">
                            {machines.map(m => (
                                <button
                                    type="button"
                                    key={m.id}
                                    onClick={() => handleMachineToggle(m.name)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${formData.allowedMachines.includes(m.name) ? 'bg-indigo-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                                >
                                    {m.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105">Save Item</button>
                </form>
            </Modal>
            {alertMessage && <AlertModal message={alertMessage} onClose={() => setAlertMessage('')} />}
        </>
    );
}

function MachineLibrary({ machines, onSetMachines }) {
    const [newMachineName, setNewMachineName] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [machineToDelete, setMachineToDelete] = useState(null);

    const handleAddMachine = (e) => {
        e.preventDefault();
        if (newMachineName.trim() === '') return;
        const newMachine = { name: newMachineName.trim(), id: `machine-${Date.now()}` };
        onSetMachines([...machines, newMachine]);
        setNewMachineName('');
    };

    const confirmDeleteMachine = (id) => {
        setMachineToDelete(id);
        setShowConfirmModal(true);
    };

    const handleDeleteMachine = () => {
        if (!machineToDelete) return;
        const updatedMachines = machines.filter(m => m.id !== machineToDelete);
        onSetMachines(updatedMachines);
        setShowConfirmModal(false);
        setMachineToDelete(null);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Machines</h2>
            <form onSubmit={handleAddMachine} className="flex gap-4">
                <input
                    type="text"
                    value={newMachineName}
                    onChange={(e) => setNewMachineName(e.target.value)}
                    placeholder="New Machine Name"
                    className="flex-grow bg-gray-700 p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center space-x-2 transition-transform transform hover:scale-105">
                    <Icon path="M12 4.5v15m7.5-7.5h-15" />
                    <span>Add Machine</span>
                </button>
            </form>
            <div className="bg-gray-800 rounded-xl p-4">
                <ul className="space-y-3">
                    {machines.length > 0 ? machines.map(machine => (
                        <li key={machine.id} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg">
                            <span className="font-medium">{machine.name}</span>
                            <button onClick={() => confirmDeleteMachine(machine.id)} className="text-gray-400 hover:text-red-500">
                                <Icon path="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </button>
                        </li>
                    )) : (
                        <p className="text-center text-gray-500">No machines added yet.</p>
                    )}
                </ul>
            </div>
            {showConfirmModal && <ConfirmationModal message="Are you sure you want to delete this machine? This may affect items that rely on it." onConfirm={handleDeleteMachine} onCancel={() => setShowConfirmModal(false)} />}
        </div>
    );
}

function DailyPlanner({ items, orders, onSetOrders, onGenerateSchedule }) {
    const [selectedItem, setSelectedItem] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [alertInfo, setAlertInfo] = useState({ show: false, message: '' });

    const handleAddOrder = (e) => {
        e.preventDefault();
        if (!selectedItem || quantity <= 0) return;
        const itemDetails = items.find(i => i.id === selectedItem);
        if (!itemDetails) return;

        const newOrder = {
            id: `order-${selectedItem}-${Date.now()}`,
            itemId: selectedItem,
            itemName: itemDetails.name,
            quantity: parseInt(quantity, 10),
            profit: (parseFloat(itemDetails.price) - parseFloat(itemDetails.cost)).toFixed(2)
        };

        onSetOrders([...orders, newOrder]);
        setSelectedItem('');
        setQuantity(1);
    };

    const handleGenerateSchedule = () => {
        onGenerateSchedule({ orders: orders, generatedAt: new Date().toISOString() });
        setAlertInfo({ show: true, message: "Schedule generated! View it in the 'Schedule View' tab." });
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Daily Planner</h2>
            <div className="bg-gray-800 rounded-xl p-6 space-y-4">
                <form onSubmit={handleAddOrder} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Select Item</label>
                        <select value={selectedItem} onChange={e => setSelectedItem(e.target.value)} className="w-full bg-gray-700 p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="">Choose an item...</option>
                            {items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Quantity</label>
                        <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} min="1" className="w-full bg-gray-700 p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-transform transform hover:scale-105">
                        <Icon path="M12 4.5v15m7.5-7.5h-15" />
                        <span>Add Order</span>
                    </button>
                </form>
            </div>

            <div className="bg-gray-800 rounded-xl p-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Today's Orders</h3>
                    <button onClick={handleGenerateSchedule} disabled={orders.length === 0} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed">
                        <Icon path="M4.5 12.75l6 6 9-13.5" />
                        <span>Generate Schedule</span>
                    </button>
                </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-700">
                                <th className="p-3">Item</th>
                                <th className="p-3">Quantity</th>
                                <th className="p-3">Total Profit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length > 0 ? orders.map((order) => (
                                <tr key={order.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                                    <td className="p-3 font-medium">{order.itemName}</td>
                                    <td className="p-3">{order.quantity}</td>
                                    <td className="p-3 text-green-400">${(order.profit * order.quantity).toFixed(2)}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="3" className="p-4 text-center text-gray-500">No orders added for today.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {alertInfo.show && <AlertModal message={alertInfo.message} onClose={() => setAlertInfo({ show: false, message: '' })} />}
        </div>
    );
}

function ScheduleView({ scheduleOrders, items, machines, settings }) {
    const formatTime = (minutesFromStart, startHour) => {
        const totalMinutes = (startHour * 60) + minutesFromStart;
        const hours = Math.floor(totalMinutes / 60) % 24;
        const mins = totalMinutes % 60;
        const period = hours >= 12 ? 'PM' : 'AM';
        let displayHour = hours % 12;
        if (displayHour === 0) displayHour = 12;
        const displayMins = mins < 10 ? `0${mins}` : mins;
        return `${displayHour}:${displayMins} ${period}`;
    };

    const scheduleData = useMemo(() => {
        if (!scheduleOrders || items.length === 0 || machines.length === 0) {
            return null;
        }

        const allTasks = scheduleOrders.flatMap(order => {
            const itemDetails = items.find(i => i.id === order.itemId);
            if (!itemDetails || !itemDetails.buildTime || itemDetails.buildTime <= 0) return [];
            const profit = (parseFloat(itemDetails.price) || 0) - (parseFloat(itemDetails.cost) || 0);
            const profitPerMinute = profit / parseFloat(itemDetails.buildTime);

            return Array(order.quantity).fill(null).map((_, i) => ({
                id: `${order.itemId}-${i}`,
                name: order.itemName,
                buildTime: parseFloat(itemDetails.buildTime),
                profit,
                profitPerMinute,
                allowedMachines: itemDetails.allowedMachines || [],
            }));
        });

        allTasks.sort((a, b) => b.profitPerMinute - a.profitPerMinute);

        const machineTimelines = machines.reduce((acc, machine) => {
            acc[machine.name] = { tasks: [], currentTime: 0 };
            return acc;
        }, {});

        const totalWorkMinutes = (settings.workHours || 8) * 60;
        let totalProfit = 0;
        const overflowTasks = [];

        for (const task of allTasks) {
            let bestMachine = null;
            let earliestFinishTime = Infinity;

            for (const machineName of task.allowedMachines) {
                if (machineTimelines[machineName]) {
                    const finishTime = machineTimelines[machineName].currentTime + task.buildTime;
                    if (finishTime < earliestFinishTime) {
                        earliestFinishTime = finishTime;
                        bestMachine = machineName;
                    }
                }
            }

            if (bestMachine && earliestFinishTime <= totalWorkMinutes) {
                const startTime = machineTimelines[bestMachine].currentTime;
                machineTimelines[bestMachine].tasks.push({ ...task, startTime, endTime: earliestFinishTime });
                machineTimelines[bestMachine].currentTime = earliestFinishTime;
                totalProfit += task.profit;
            } else {
                overflowTasks.push(task);
            }
        }
        return { schedule: machineTimelines, totalProfit, overflowTasks };
    }, [scheduleOrders, items, machines, settings]);

    const aggregatedOverflow = useMemo(() => {
        if (!scheduleData || !scheduleData.overflowTasks) return { items: {}, totalProfit: 0 };

        const items = scheduleData.overflowTasks.reduce((acc, task) => {
            acc[task.name] = (acc[task.name] || 0) + 1;
            return acc;
        }, {});

        const totalProfit = scheduleData.overflowTasks.reduce((sum, task) => sum + task.profit, 0);

        return { items, totalProfit };
    }, [scheduleData]);

    if (!scheduleData) {
        return (
            <div className="text-center p-8 bg-gray-800 rounded-xl">
                <Icon path="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M12 12.75h.008v.008H12v-.008z" className="w-16 h-16 mx-auto text-gray-500 mb-4" />
                <h3 className="text-2xl font-bold">No Schedule Generated</h3>
                <p className="text-gray-400 mt-2">Go to the Daily Planner to add orders and generate a schedule for today.</p>
            </div>
        );
    }

    const { schedule: optimizedSchedule, totalProfit } = scheduleData;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                 <h2 className="text-3xl font-bold">Optimized Schedule View</h2>
                 <div className="flex items-center gap-4">
                     <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2 text-center">
                        <p className="text-sm text-green-300">Scheduled Profit</p>
                        <p className="text-2xl font-bold text-green-400">${totalProfit.toFixed(2)}</p>
                     </div>
                 </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {Object.entries(optimizedSchedule).map(([machineName, data]) => (
                    <div key={machineName} className="bg-gray-800 rounded-xl p-4">
                        <h3 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">{machineName}</h3>
                        <div className="space-y-3">
                            {data.tasks.length > 0 ? data.tasks.map((task, index) => (
                                <div key={index} className="bg-gray-700/50 p-3 rounded-lg">
                                    <p className="font-bold">{task.name}</p>
                                    <p className="text-sm text-gray-400">
                                        Time: {formatTime(task.startTime, settings.workdayStartHour)} - {formatTime(task.endTime, settings.workdayStartHour)}
                                    </p>
                                    <p className="text-sm text-green-400">Profit: ${task.profit.toFixed(2)}</p>
                                </div>
                            )) : (
                                <p className="text-gray-500">No tasks scheduled for this machine.</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {scheduleData.overflowTasks.length > 0 && (
                 <div className="mt-8">
                    <div className="flex justify-between items-center bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                        <div>
                            <h3 className="text-2xl font-bold text-yellow-300">Overflow Orders</h3>
                            <p className="text-yellow-400">These items could not be scheduled within the workday.</p>
                        </div>
                        <div className="text-right">
                             <p className="text-sm text-yellow-300">Missed Profit</p>
                             <p className="text-2xl font-bold text-yellow-400">${aggregatedOverflow.totalProfit.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-4">
                        <ul className="space-y-2">
                            {Object.entries(aggregatedOverflow.items).map(([name, count]) => (
                                <li key={name} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg">
                                    <span className="font-medium">{name}</span>
                                    <span className="font-bold text-yellow-400">x {count}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}

function Settings({ settings, onSetSettings, onClearData }) {
    const [alertInfo, setAlertInfo] = useState({ show: false, message: '' });
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const handleSaveSettings = () => {
        // The parent component's useEffect already saves all data,
        // but we can show a confirmation message here.
        setAlertInfo({ show: true, message: "Settings saved!"});
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const parsedValue = parseInt(value, 10);
        // Basic validation
        if (isNaN(parsedValue)) return;
        onSetSettings(prev => ({ ...prev, [name]: parsedValue }));
    };

    const confirmClearData = () => {
        setShowConfirmModal(true);
    };

    const handleConfirmClear = () => {
        setShowConfirmModal(false);
        onClearData();
    };

    return (
        <div className="space-y-6 max-w-lg mx-auto">
            <h2 className="text-3xl font-bold">Settings</h2>
            <div className="bg-gray-800 rounded-xl p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Workday Start Hour (24h)</label>
                        <input
                            type="number"
                            name="workdayStartHour"
                            value={settings.workdayStartHour || 9}
                            onChange={handleInputChange}
                            min="0"
                            max="23"
                            className="w-full bg-gray-700 p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Workday Length (hours)</label>
                        <input
                            type="number"
                            name="workHours"
                            value={settings.workHours || 8}
                            onChange={handleInputChange}
                            min="1"
                            max="24"
                            className="w-full bg-gray-700 p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <button onClick={handleSaveSettings} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105">
                    Save Settings
                </button>
            </div>

            <div className="bg-red-800/50 border border-red-500/30 rounded-xl p-6 space-y-4">
                <h3 className="text-xl font-bold text-red-400">Danger Zone</h3>
                <p className="text-gray-400 text-sm">This action cannot be undone. This will permanently delete all your items, machines, and schedule data from this browser.</p>
                <button onClick={confirmClearData} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105">
                    Clear All Data
                </button>
            </div>

            {alertInfo.show && <AlertModal message={alertInfo.message} onClose={() => setAlertInfo({ show: false, message: '' })} />}
            {showConfirmModal && <ConfirmationModal message="Are you sure you want to delete all application data? This cannot be undone." onConfirm={handleConfirmClear} onCancel={() => setShowConfirmModal(false)} />}
        </div>
    );
}

export default App;
