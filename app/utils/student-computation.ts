// Helper: Force rounding to 2 decimal places
function round(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

const ALL_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getSchoolYearMonths(startMonth: string): string[] {
  const normalizedStart =
    startMonth.charAt(0).toUpperCase() + startMonth.slice(1).toLowerCase();
  const startIndex = ALL_MONTHS.indexOf(normalizedStart);
  const validStartIndex = startIndex === -1 ? 5 : startIndex;

  const schoolMonths: string[] = [];
  for (let i = 0; i < 10; i++) {
    const monthIndex = (validStartIndex + i) % 12;
    const monthName = ALL_MONTHS[monthIndex];
    if (monthName) schoolMonths.push(monthName);
  }
  return schoolMonths;
}

export default function studentComputation(newVal: any) {
  // 1. Safety Checks
  if (!newVal || !newVal.total_amount_due) {
    return {
      selected_students: newVal,
      total_paid: 0,
      overall_balance: 0,
      remaining_per_month: {},
      available_payment_option: [],
      hasPendingTransaction: false,
    };
  }

  const schoolStartMonth = "June";
  const months = getSchoolYearMonths(schoolStartMonth);

  // 2. Extract Transactions
  const transactionItems = newVal.transactions
    ? newVal.transactions
      .filter((t: any) => t.status === "paid")
      .flatMap((t: any) =>
        (t.items || []).map((i: any) => ({
          ...i,
          normalizedType: i.item_type,
        })),
      )
    : [];

  const payments = {
    totalPaid: 0,
    perMonthPaid: {} as Record<string, number>,
  };

  months.forEach((m) => {
    payments.perMonthPaid[m] = 0;
  });

  // 3. Tally Payments
  const TUITION_KEYWORDS = [
    "Full Payment",
    "Downpayment",
    "Down Payment",
    "DP",
    "Partial Payment",
    "Partial",
    "Tuition",
    "Tuition Fee",
    "Upon Enrollment",
    "Reservation Fee", // Usually RF is deducted from Tuition, user can remove if not
    "RF"
  ];

  transactionItems.forEach((item: any) => {
    const type = item.normalizedType;
    const amount = Number(item.amount) || 0;

    // ✅ FIX: Only count Tuition-related payments. Exclude Sundries (Uniform, ID, etc.)
    const isMonth = months.includes(type);
    const isKeyword = TUITION_KEYWORDS.some(k => type.toLowerCase() === k.toLowerCase());
    const isTuitionLike = type.toLowerCase().includes('tuition');

    const isTuitionPayment = isMonth || isKeyword || isTuitionLike;

    if (isTuitionPayment) {
      payments.totalPaid += amount;

      // If it matches a specific month name, track it for that bucket
      if (isMonth) {
        payments.perMonthPaid[type] =
          (payments.perMonthPaid[type] || 0) + amount;
      }
    }
  });

  payments.totalPaid = round(payments.totalPaid);

  const totalAmountDue = Number(newVal.total_amount_due) || 0;

  // Balance Check (Clamped to 0)
  const balance = round(Math.max(0, totalAmountDue - payments.totalPaid));

  // 4. Calculate Monthly Amortization
  const perMonthAmount = round(totalAmountDue / 10);

  const remainingPerMonth: Record<string, number> = {};
  let carryOver = 0;

  const hasFullPayment = transactionItems.some(
    (item: any) => item.normalizedType === "Full Payment",
  );

  months.forEach((m) => {
    remainingPerMonth[m] = 0;
  });

  if (!hasFullPayment && balance > 0) {
    // Logic: Calculate "Unallocated Credit"
    // This is money paid (like Downpayment) that wasn't assigned to a specific month name
    const totalSpecificMonthPaid = Object.values(payments.perMonthPaid).reduce(
      (a, b) => a + b,
      0,
    );
    const unallocatedCredit = round(
      payments.totalPaid - totalSpecificMonthPaid,
    );

    carryOver = unallocatedCredit;

    for (const m of months) {
      const paid = round((payments.perMonthPaid[m] || 0) + carryOver);

      if (paid >= perMonthAmount) {
        remainingPerMonth[m] = 0;
        carryOver = round(paid - perMonthAmount);
      } else {
        const due = round(Math.max(0, perMonthAmount - paid));
        remainingPerMonth[m] = due;
        carryOver = 0;
      }
    }
  }

  // 5. Determine Options
  const availableOptions: string[] = [];

  const hasPendingTransaction =
    newVal.transactions?.some((t: any) => {
      return (
        t.status === "pending" &&
        (t.items || []).some((item: any) => {
          return [...months, "Full Payment"].includes(item.item_type);
        })
      );
    }) ?? false;

  if (!hasPendingTransaction && balance > 0.01) {
    for (const m of months) {
      if ((remainingPerMonth[m] || 0) > 1) {
        availableOptions.push(m);
        break;
      }
    }
    availableOptions.push("Full Payment");
  }

  return {
    selected_students: newVal,
    total_paid: payments.totalPaid,
    overall_balance: balance,
    remaining_per_month: remainingPerMonth,
    available_payment_option: availableOptions,
    hasPendingTransaction,
  };
}
