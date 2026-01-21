export default function studentComputation(newVal: any) {
  if (!newVal) {
    return {
      selected_students: newVal,
      total_paid: 0,
      overall_balance: 0,
      remaining_per_month: {},
      available_payment_option: [],
      hasPendingTransaction: false,
    };
  }

  // User Request: "no more paying of the tuition fee. we just keep it as a record so we remove the total paid, remaining balance. just keep the total fees for keeping a record."
  // Logic: We disable all tuition payment calculations.
  
  return {
    selected_students: newVal,
    total_paid: 0,
    overall_balance: 0,
    remaining_per_month: {},
    available_payment_option: [],
    hasPendingTransaction: false,
  };
}