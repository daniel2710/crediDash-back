// Test script for custom payment functionality
// This is a simple test to verify the endpoint works with different scenarios

const testCases = [
    {
        name: "Standard Payment Test",
        body: {
            loanId: "507f1f77bcf86cd799439011",
            workspaceId: "507f1f77bcf86cd799439012",
            paymentAmount: 1000,
            isCustomPayment: false
        }
    },
    {
        name: "Custom Payment Test",
        body: {
            loanId: "507f1f77bcf86cd799439011",
            workspaceId: "507f1f77bcf86cd799439012",
            paymentAmount: 1500,
            isCustomPayment: true
        }
    },
    {
        name: "Specific Installment Payment Test",
        body: {
            loanId: "507f1f77bcf86cd799439011",
            workspaceId: "507f1f77bcf86cd799439012",
            paymentAmount: 750,
            installmentId: "507f1f77bcf86cd799439013"
        }
    },
    {
        name: "Invalid Amount Test",
        body: {
            loanId: "507f1f77bcf86cd799439011",
            workspaceId: "507f1f77bcf86cd799439012",
            paymentAmount: -500,
            isCustomPayment: true
        }
    },
    {
        name: "Invalid Combination Test (installmentId + isCustomPayment)",
        body: {
            loanId: "507f1f77bcf86cd799439011",
            workspaceId: "507f1f77bcf86cd799439012",
            paymentAmount: 500,
            installmentId: "507f1f77bcf86cd799439013",
            isCustomPayment: true
        }
    }
];

console.log("Custom Payment Test Cases:");
console.log("==========================");
testCases.forEach((test, index) => {
    console.log(`${index + 1}. ${test.name}`);
    console.log("Request Body:", JSON.stringify(test.body, null, 2));
    console.log("---");
});

console.log("\nUsage: Send these requests to POST /installments/pay");
console.log("Make sure to replace the IDs with actual loan and workspace IDs from your database.");

console.log("\n📋 New Features:");
console.log("✅ Installment IDs are now tracked in payment history");
console.log("✅ Detailed installment processing information is recorded");
console.log("✅ NEW: Pay specific installments by ID using installmentId parameter");
console.log("✅ Each payment transaction includes:");
console.log("   - paid_installment_ids: Array of liquidated installment IDs");
console.log("   - installment_details: Array with detailed info for each affected installment");
console.log("     * installment_id: The MongoDB _id of the installment");
console.log("     * amount_paid: Amount applied to this installment");
console.log("     * previous_status: Status before payment");
console.log("     * new_status: Status after payment");

console.log("\n🎯 Payment Modes:");
console.log("1️⃣ Standard Payment (default): Processes installments sequentially");
console.log("2️⃣ Custom Payment (isCustomPayment: true): Distributes proportionally across all pending installments");
console.log("3️⃣ Specific Installment (installmentId: 'ID'): Pays only the specified installment");

console.log("\n⚠️ Important Rules:");
console.log("• installmentId and isCustomPayment are mutually exclusive");
console.log("• installmentId must be a valid MongoDB ObjectId from the loan's installments array");
console.log("• Payment amount cannot exceed the remaining balance of the specific installment");

console.log("\n📝 Example Response Structure:");
console.log(`
{
  "status": "success",
  "message": "Payment processed successfully",
  "updatedLoan": {
    "history": [{
      "payment_date": "2026-05-05T...",
      "payment": 1500,
      "remaining_balance": 2500,
      "paid_installments": 2,
      "loan_status": "partial",
      "paid_installment_ids": ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014"],
      "installment_details": [
        {
          "installment_id": "507f1f77bcf86cd799439013",
          "amount_paid": 750,
          "previous_status": "pending",
          "new_status": "liquidated"
        },
        {
          "installment_id": "507f1f77bcf86cd799439014", 
          "amount_paid": 750,
          "previous_status": "pending",
          "new_status": "liquidated"
        }
      ]
    }]
  }
}
`);
