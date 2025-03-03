let app1 = new Vue({
	el: "#vue-app",
	data(){
		return {
			sortAttribute: '',
			subjects:[],
			cart: [],
			showProduct: true,
			searchValue: "",
			sortOrder: "ascending",
			phoneError: "",
			order: {
					firstname: "", 
					lastname: "", 
					address: "", 
					city: "", 
					state: "", 
					phone: "", 
					method: "Home", 
					gift: false, 
					sendGift: 'Yes', 
					dontSendGift: 'No'
					// Remove cart from here - we'll add it when sending
			}                       
		}
	},
	methods:{
			addItemToCart(subject){
					this.cart.push(subject.id);
			},
			canAddToCart(subject){
					return subject.availableInventory > this.cartCount(subject.id);
			},
			showCheckout(){
					if(this.showProduct){
							this.showProduct = false;
					}
					else{
							this.showProduct = true;
					}
			},
			cartCount(id){
					let count = 0;
					for (let i = 0; i < this.cart.length; i++) {
							if (this.cart[i] === id) {
									count++;
							}
					}
					return count;
			},
			submitCheckOut(){
					alert('Check-out completed successfully');
			},
			removeItemFromCart(subject){
					let index = this.cart.indexOf(subject.id);
					this.cart.splice(index, 1);
			},
			search(){
					let searchValueTemp = this.searchValue;
					if (!searchValueTemp) {
							// If search is empty, reload all subjects
							this.loadAllSubjects();
							return;
					}
					
					fetch(`http://localhost:3000/search/${searchValueTemp}`)
							.then(response => {
									if (!response.ok) {
											throw new Error(`Search failed: ${response.status} ${response.statusText}`);
									}
									return response.json();
							})
							.then(json => {
									this.subjects = json;
							})
							.catch(error => {
									console.error("Error fetching data:", error);
									alert("Search failed. Please try again.");
							});
			},
			verifyPhone(){
					// Fix the phone validation - access order.phone properly
					if (!/^(?:\+230)?(2\d{6}|5\d{7})$/.test(this.order.phone)) {
							this.phoneError = "Please enter a valid phone number";
							return false;
					} else {
							this.phoneError = "";
							return true;
					}
			},
			sendOrder(){
					// Verify phone first
					if (!this.verifyPhone()) {
							alert("Please enter a valid phone number");
							return;
					}
					
					// Check for required fields
					if (!this.order.firstname || !this.order.lastname) {
							alert("Please fill in your name");
							return;
					}
					
					// Create order object with cart
					const orderWithCart = {
							...this.order,
							cart: [...this.cart]
					};
					
					console.log("Sending order:", orderWithCart);
					
					fetch("http://localhost:3000/checkout", {
							method: "POST",
							headers: {
									"Content-Type": "application/json",
							},
							body: JSON.stringify(orderWithCart)
					})
					.then(res => {
							if (!res.ok) {
									throw new Error(`Order failed: ${res.status} ${res.statusText}`);
							}
							return res.json();
					})
					.then(data => {
							alert(`Order Completed! Your order ID is: ${data.orderId}`);
							// Clear cart and return to home page
							this.cart = [];
							this.showProduct = true;
							// Reset order form
							this.resetOrderForm();
					})
					.catch(error => {
							console.error("Order error:", error);
							alert("Order Failed: " + error.message);
					});
			},
			resetOrderForm() {
					this.order = {
							firstname: "", 
							lastname: "", 
							address: "", 
							city: "", 
							state: "", 
							phone: "", 
							method: "Home", 
							gift: false, 
							sendGift: 'Yes', 
							dontSendGift: 'No'
					};
			},
			loadAllSubjects() {
					fetch("http://localhost:3000/collections1/Subjects")
							.then(response => {
									if (!response.ok) {
											throw new Error(`Failed to load subjects: ${response.status} ${response.statusText}`);
									}
									return response.json();
							})
							.then(json => {
									this.subjects = json;
									console.log("Loaded subjects:", this.subjects.length);
							})
							.catch(error => {
									console.error("Error fetching subjects:", error);
									alert("Failed to load subjects. Please refresh the page.");
							});
			}
	},

	created: function() {
			this.loadAllSubjects();
	},
	computed:{
			itemInCart: function(){
					return this.cart.length || "";
			},        
			sortedSubjects() {
					// If no subjects yet, return empty array
					if (!this.subjects || this.subjects.length === 0) {
							return [];
					}
					
					// Create a copy to prevent mutating the original array
					let sortedArray = [...this.subjects];
					
					// If no sort attribute is selected, return the unsorted array
					if (!this.sortAttribute) {
							return sortedArray;
					}
					
					// Sort based on the selected attribute and order
					sortedArray.sort((a, b) => {
							let valueA = a[this.sortAttribute];
							let valueB = b[this.sortAttribute];
							
							// Handle strings for case-insensitive sorting
							if (typeof valueA === "string" && typeof valueB === "string") {
									valueA = valueA.toLowerCase();
									valueB = valueB.toLowerCase();
							}
							
							// Sort based on selected order
							if (this.sortOrder === "ascending") {
									return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
							} else {
									return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
							}
					});
					
					return sortedArray;
			},
			// Add a computed property to show cart items with counts
			cartItemsWithCount() {
					const itemMap = {};
					
					// Count items in cart
					this.cart.forEach(id => {
							if (!itemMap[id]) {
									// Find the subject details
									const subject = this.subjects.find(s => s.id === id);
									if (subject) {
											itemMap[id] = {
													id: id,
													name: subject.name,
													count: 1,
													price: subject.price
											};
									}
							} else {
									itemMap[id].count++;
							}
					});
					
					return Object.values(itemMap);
			},
			// Calculate total price
			cartTotal() {
					let total = 0;
					this.cartItemsWithCount.forEach(item => {
							total += item.price * item.count;
					});
					return total.toFixed(2);
			}
	}
});