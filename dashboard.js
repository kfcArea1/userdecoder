document.addEventListener('DOMContentLoaded', function() {
    let unsubscribeStoreListener = null;
    let storeID = '';
    let storecode = '';

    // Check authentication state
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }

        const storeId = user.email.split('@')[0];
        const final_storeID = "K" + storeId;
        sessionStorage.setItem('final_storeID', final_storeID);
        storecode = final_storeID;

        // Set initial loading state
        updateStoreStatus('loading');

        try {
            // Get initial store data
            const storeDoc = await db.collection('stores').doc(storeId).get();
            
            if (!storeDoc.exists) {
                console.error('Store data not found!');
                updateStoreStatus('error');
                return;
            }

            const storeData = storeDoc.data();
            storeID = storeData.champsId;
            
            updateStoreUI(storeData, final_storeID);
            
            // Update status based on store data
            if (!storeData.status) {
                console.warn('Status field missing in store document');
                updateStoreStatus('inactive');
                disableStoreFunctions();
            } else {
                updateStoreStatus(storeData.status);
                if (storeData.status.toLowerCase() === 'active') {
                    enableStoreFunctions();
                } else {
                    disableStoreFunctions();
                }
            }

            // Set up real-time listener for store updates
            unsubscribeStoreListener = db.collection('stores').doc(storeId)
                .onSnapshot((doc) => {
                    if (doc.exists) {
                        const updatedData = doc.data();
                        console.log('Store update received:', updatedData);
                        
                        updateStoreUI(updatedData, final_storeID);
                        
                        if (updatedData.status) {
                            updateStoreStatus(updatedData.status);
                            
                            if (updatedData.status.toLowerCase() === 'active') {
                                enableStoreFunctions();
                            } else {
                                disableStoreFunctions();
                            }
                        } else {
                            updateStoreStatus('inactive');
                            disableStoreFunctions();
                        }
                    }
                }, (error) => {
                    console.error("Error listening to store updates:", error);
                    updateStoreStatus('error');
                });

        } catch (error) {
            console.error("Error loading store data:", error);
            updateStoreStatus('error');
        }
    });

    function updateStoreUI(storeData, final_storeID) {
        const elements = {
            'storeNameDisplay': storeData.name || 'N/A',
            'storeIdDisplay': final_storeID,
            'champsIdDisplay': storeData.champsId || 'N/A',
            'managerNameDisplay': storeData.manager || 'N/A',
            'phoneDisplay': storeData.phone || 'N/A',
            'feedbackLinksCount': storeData.feedbackLinks || 0,
            'totalResponses': storeData.totalResponses || 0
        };

        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        }
    }

    function updateStoreStatus(status) {
        const statusElement = document.getElementById('storeStatusDisplay');
        if (!statusElement) {
            console.error('Status element not found!');
            return;
        }
        
        // Normalize the status
        const normalizedStatus = String(status || 'inactive').trim().toLowerCase();
        
        // Clear all classes and set new one
        statusElement.className = 'store-status';
        statusElement.classList.add(normalizedStatus);
        statusElement.textContent = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
        
        console.log('Status updated to:', normalizedStatus);
    }

    function disableStoreFunctions() {
        console.log('Disabling store functions');
        
        // Hide the link generator section
        const linkGeneratorSection = document.getElementById('linkGeneratorSection');
        if (linkGeneratorSection) {
            linkGeneratorSection.style.display = 'none';
        }
        
        // Show the inactive warning
        const inactiveWarning = document.getElementById('inactiveWarning');
        if (inactiveWarning) {
            inactiveWarning.style.display = 'flex';
        }
        
        // Disable any remaining interactive elements
        const elementsToDisable = [
            document.getElementById('fileInput'),
            document.querySelector('.copy-all-button'),
            document.getElementById('createLinkBtn')
        ];
        
        elementsToDisable.forEach(el => {
            if (el) el.disabled = true;
        });
    }

    function enableStoreFunctions() {
        console.log('Enabling store functions');
        
        // Show the link generator section
        const linkGeneratorSection = document.getElementById('linkGeneratorSection');
        if (linkGeneratorSection) {
            linkGeneratorSection.style.display = 'block';
        }
        
        // Hide the inactive warning
        const inactiveWarning = document.getElementById('inactiveWarning');
        if (inactiveWarning) {
            inactiveWarning.style.display = 'none';
        }
        
        // Enable interactive elements
        const elementsToEnable = [
            document.getElementById('fileInput'),
            document.querySelector('.copy-all-button'),
            document.getElementById('createLinkBtn')
        ];
        
        elementsToEnable.forEach(el => {
            if (el) el.disabled = false;
        });
    }

    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function() {
        if (unsubscribeStoreListener) {
            unsubscribeStoreListener();
        }
        auth.signOut().then(() => {
            sessionStorage.removeItem('final_storeID');
            window.location.href = 'index.html';
        }).catch(error => {
            console.error("Logout error:", error);
        });
    });

    // Create new feedback link
    document.getElementById('createLinkBtn').addEventListener('click', async function() {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Not authenticated');
            
            const storeId = user.email.split('@')[0];
            const storeDoc = await db.collection('stores').doc(storeId).get();
            const storeData = storeDoc.data();
            
            if (!storeData.status || storeData.status.toLowerCase() !== 'active') {
                throw new Error('Store is inactive. Cannot create feedback links.');
            }
            
            const linkId = generateLinkId();
            
            await db.collection('feedbackLinks').doc(linkId).set({
                storeId: storeId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true,
                responseCount: 0
            });
            
            await db.collection('stores').doc(storeId).update({
                feedbackLinks: firebase.firestore.FieldValue.increment(1)
            });
            
            const feedbackLink = `${window.location.origin}/feedback.html?lid=${linkId}`;
            alert(`New feedback link created!\n\n${feedbackLink}\n\nCopy this link to share with customers.`);
            
            window.location.reload();
            
        } catch (error) {
            console.error("Error creating feedback link:", error);
            alert("Failed to create feedback link: " + error.message);
        }
    });

    // View responses button
    document.getElementById('viewResponsesBtn').addEventListener('click', function() {
        alert('Responses viewing functionality will be implemented in the next phase');
    });

    // Survey generator button
    document.getElementById('surveyGeneratorBtn').addEventListener('click', function() {
        window.location.href = 'survey-generator.html';
    });

    // File input handler
    document.getElementById('fileInput').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = function(event) {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

            const tableBody = document.querySelector('#linkTable tbody');
            tableBody.innerHTML = '';

            sheetData
                .filter(row => {
                    const posReceipt = row['POS Receipt No.'] || '';
                    return !(
                        posReceipt.includes(storecode+'SWG') || 
                        posReceipt.includes(storecode+'ZMT') || 
                        posReceipt.includes(storecode+'MAGIC')
                    );
                })
                .forEach(row => {
                    const link = generateSurveyLink(row);
                    
                    if (link) {
                        const newRow = document.createElement('tr');
                        newRow.innerHTML = `
                            <td>${row['Receipt No.']}</td>
                            <td>${row['Sales Type']}</td>
                            <td>
                                <button class="copy-button" 
                                        data-link="${encodeURIComponent(link)}"
                                        onclick="handleCopyClick(this)">
                                    Copy
                                </button>
                            </td>
                            <td style="display: none;" class="generated-link">${link}</td>
                        `;
                        tableBody.appendChild(newRow);
                    }
                });
        };

        reader.readAsArrayBuffer(file);
    });
});

// Helper functions
function generateLinkId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
// Add this to your existing dashboard.js
document.addEventListener('DOMContentLoaded', function() {
    // Existing auth state check...
    
    // Add this event listener for the survey generator button
    document.getElementById('surveyGeneratorBtn').addEventListener('click', function() {
        window.location.href = 'survey-generator.html';
    });

    // Rest of your existing dashboard code...
});





// link generator code
let storeID = ''; // Will be populated after we fetch store data
let storecode = ''; 

// Get the store data (similar to your dashboard code)
auth.onAuthStateChanged(async (user) => {
    if (user) {
        const storeId = user.email.split('@')[0];
        const storeDoc = await db.collection('stores').doc(storeId).get();
        
        if (storeDoc.exists) {
            const storeData = storeDoc.data();
            storeID = storeData.champsId;
            storecode = sessionStorage.getItem('final_storeID'); // Now storeID contains the actual value
        }
    }
});

function convertExcelDate(serial) {
    const date = new Date((serial - 25569) * 86400 * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function convertExcelTime(serial) {
    const totalMilliseconds = Math.round(serial * 24 * 60 * 60 * 1000);
    const hours = String(Math.floor(totalMilliseconds / (60 * 60 * 1000))).padStart(2, '0');
    const minutes = String(Math.floor((totalMilliseconds % (60 * 60 * 1000)) / (60 * 1000))).padStart(2, '0');
    const seconds = String(Math.floor((totalMilliseconds % (60 * 1000)) / 1000)).padStart(2, '0');
    const milliseconds = String(totalMilliseconds % 1000).padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

function generateSurveyLink(row) {
    const receiptNo = row['Receipt No.'];
    const salesType = row['Sales Type'];

    let surveyModel = '';
    let orderID = '';
    let numericOT = '';

    if (/^\d+$/.test(receiptNo) && salesType === 'TAKEAWAY') {
        surveyModel = '6.0';
        orderID = receiptNo;
        numericOT = '2';
    } else if (/^\d+$/.test(receiptNo) && salesType === 'DINE-IN') {
        surveyModel = '6.0';
        orderID = receiptNo;
        numericOT = '1';
    } else if (receiptNo.startsWith(storecode) && salesType === 'TAKEAWAY') {
        surveyModel = '4.0';
        orderID = receiptNo.slice(-4);
        numericOT = '2';
    } else if (receiptNo.startsWith(storecode) && salesType === 'DINE-IN') {
        surveyModel = '4.0';
        orderID = receiptNo.slice(-4);
        numericOT = '1';
    } else if (receiptNo.startsWith(storecode) && salesType === 'DELIVERY') {
        surveyModel = '3.0';
        orderID = receiptNo;
        numericOT = '3';
    } else {
        return null;
    }

    const date = convertExcelDate(row['Date']);
    const time = convertExcelTime(row['Time']);
    const phoneNumber = `91${row['Sell-to Contact No.']}`;
    const isoDateTime = `${date}T${time}Z`;

    const data = {
        "S": storeID,
        "OI": orderID,
        "D": date,
        "TM": time,
        "DTM": isoDateTime,
        "TI": orderID,
        "OT": numericOT,
        "SM": surveyModel,
        "PH": phoneNumber
    };

    const encodedData = btoa(JSON.stringify(data));
    return `https://customer.kfc-listens.com/jfe/form/SV_8bHC0noyvM3jPWC?Q_EED=${encodedData}`;
}

document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const tableBody = document.querySelector('#linkTable tbody');
        tableBody.innerHTML = '';

        sheetData
            .filter(row => {
                const posReceipt = row['POS Receipt No.'] || '';
                return !(
                    posReceipt.includes(storecode+'SWG') || 
                    posReceipt.includes(storecode+'ZMT') || 
                    posReceipt.includes(storecode+'MAGIC')
                );
            })
            .forEach(row => {
                const link = generateSurveyLink(row);
                
                if (link) {
                    const newRow = document.createElement('tr');
                    newRow.innerHTML = `
                        <td>${row['Receipt No.']}</td>
                        <td>${row['Sales Type']}</td>
                        <td>
                            <button class="copy-button" 
                                    data-link="${encodeURIComponent(link)}"
                                    data-model="${link.includes('SM=6.0') ? '6.0' : 
                                               link.includes('SM=4.0') ? '4.0' : 
                                               link.includes('SM=3.0') ? '3.0' : 'Unknown'}"
                                    onclick="handleCopyClick(this)">
                                Copy
                            </button>
                        </td>
                        <!-- Hidden columns -->
                        <td style="display: none;">${link.includes('SM=6.0') ? '6.0' : 
                                                  link.includes('SM=4.0') ? '4.0' : 
                                                  link.includes('SM=3.0') ? '3.0' : 'Unknown'}</td>
                        <td style="display: none;" class="generated-link">${link}</td>
                    `;
                    tableBody.appendChild(newRow);
                }
                function handleCopyClick(button) {
                    const link = decodeURIComponent(button.getAttribute('data-link'));
                    
                    navigator.clipboard.writeText(link).then(() => {
                        // Change button appearance
                        button.innerHTML = 'Copied!';
                        button.style.backgroundColor = '#dc3545'; // Red color
                        button.style.color = 'white';
                        button.disabled = true;
                        
                        // Revert after 3 seconds
                        setTimeout(() => {
                            button.innerHTML = 'Copy';
                            button.style.backgroundColor = '#28a745';
                            button.style.color = 'white';
                            button.disabled = false;
                        }, 3000);
                    }).catch(err => {
                        console.error('Copy failed:', err);
                        button.innerHTML = 'Error!';
                        button.style.backgroundColor = '#ffc107'; // Yellow for error
                    });
                }
            });
    };

    reader.readAsArrayBuffer(file);
});

// Single link copy
function copyLink(link) {
    navigator.clipboard.writeText(decodeURIComponent(link)).then(() => {
        alert('Link copied to clipboard!');
    });
}

// All links copy (modified to use hidden cells)
function copyLinks() {
    const links = Array.from(document.querySelectorAll('.generated-link'))
                     .map(cell => cell.textContent)
                     .join('\n');
    navigator.clipboard.writeText(links).then(() => {
        alert('Links copied to clipboard!');
    });
}

// Update event listener for dynamically created buttons
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('copy-button')) {
        copyLink(e.target.getAttribute('data-link'));
    }
});

document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key))) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
});