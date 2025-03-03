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
			phoneError: "", // Added to store phone validation error messages
			order: {
					firstname: "", lastname: "", address: "", city: "", state: "", phone: "", method: "Home", gift: false, sendGift: 'Yes', dontSendGift: 'No'
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
			cartCount(id)
					{
							let count = 0;
							for (let i = 0; i < this.cart.length; i++)
							{
									if (this.cart[i] === id)
									{
											count ++
									}
							}
							return count;
					},
			submitCheckOut(){
					alert('Check-out completed successfully')
			},
			removeItemFromCart(subject){
					let index = this.cart.indexOf(subject.id);
					this.cart.splice(index, 1);
			},
			search(){
					let searchValueTemp = this.searchValue
					fetch(`http://localhost:3000/search/${searchValueTemp}`)
							.then(response => response.json())
							.then(json => {
									this.subjects = json;
							})
							.catch(error => {
									console.error("Error fetching data:", error);
							});
					
			},
			// Fixed phone validation function
			verifyPhone(){
				// Make sure we're using the order.phone property, not this.phone
				const phoneNumber = this.order.phone.toString();
				
				// Regex for Mauritius phone numbers: 
				// - Optional +230 prefix
				// - Starting with 2 (followed by 6 digits) or 5 (followed by 7 digits)
				const maurPhoneRegex = /^(?:\+230)?(2\d{6}|5\d{7})$/;
				
				if (!maurPhoneRegex.test(phoneNumber)) {
					this.phoneError = "Please enter a valid Mauritius phone number";
					return false;
				} else {
					this.phoneError = "";
					return true;
				}
			},
			sendOrder(){
				// First verify the phone number
				if (!this.verifyPhone()) {
					alert(this.phoneError);
					return; // Stop form submission if phone is invalid
				}
				
				const orderWithCart = {
					...this.order,
					cart: [...this.cart]
				};
			
				console.log(orderWithCart);
				fetch("http://localhost:3000/checkout", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(orderWithCart)
				}).then((res)=>{
					if (res.ok) {
						alert("Order Completed");
						// Clear cart and reset form after successful order
						this.cart = [];
						this.resetForm();
						this.showProduct = true; // Return to product page
					} else {
						alert("Order Failed");
					}
				}).catch(error => {
					console.error("Order error:", error);
					alert("Order Failed: " + error.message);
				});
			},
			// Added method to reset the form after successful order
			resetForm() {
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
				this.phoneError = "";
			}
	},

	created: function() {
			fetch("http://localhost:3000/collections1/Subjects")
					.then(response => response.json())
					.then(json => {
							this.subjects = json; 
							console.log(this.subjects);
					})
					.catch(error => {
							console.error("Error fetching data:", error);
					});
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
			}
	}
});