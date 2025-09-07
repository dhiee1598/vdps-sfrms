export default function studentComputation(newVal: any) {
  if (!newVal) {
    return;
  }

  const transactionItems = newVal.transactions
    ? newVal.transactions.flatMap((t: any) =>
        t.items.map((i: any) => ({ ...i, normalizedType: normalizeItem(i.item_type) })),
      )
    : [];

  const payments: any = {
    downpayment: 0,
    totalPaid: 0,
    perQuarterPaid: {
      '1st Quarter': 0,
      '2nd Quarter': 0,
      '3rd Quarter': 0,
      '4th Quarter': 0,
    },
  };

  transactionItems.forEach((item: any) => {
    if (item.normalizedType) {
      const amount = Number(item.amount) || 0;
      payments.totalPaid += amount;

      if (item.normalizedType === 'Downpayment') {
        payments.downpayment += amount;
      }
      else if (item.normalizedType in payments.perQuarterPaid) {
        payments.perQuarterPaid[item.normalizedType] += amount;
      }
    }
  });

  const totalAmountDue = Number(newVal.total_amount_due);
  const balance = totalAmountDue - payments.totalPaid;

  const perQuarterAmount = (totalAmountDue - payments.downpayment) / 4;

  const quarters = ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter'];
  const remainingPerQuarter: Record<string, number> = {};
  let carryOver = 0;

  const hasFullPayment = transactionItems.some(
    (item: any) => item.normalizedType === 'Full Payment',
  );

  if (hasFullPayment) {
    quarters.forEach(q => remainingPerQuarter[q] = 0);
  }
  else {
    for (const q of quarters) {
      const paid = payments.perQuarterPaid[q] + carryOver;

      if (paid >= perQuarterAmount) {
        remainingPerQuarter[q] = 0;
        carryOver = paid - perQuarterAmount;
      }
      else {
        remainingPerQuarter[q] = perQuarterAmount - paid;
        carryOver = 0;
      }
    }
  }

  const availableOptions: string[] = [];
  const hasDownpayment = payments.downpayment > 0;

  if (!hasDownpayment) {
    if (!hasFullPayment) {
      availableOptions.push('Downpayment', 'Full Payment');
    }
  }
  else {
    let allQuartersPaid = true;

    for (const q of quarters) {
      if ((remainingPerQuarter[q] || 0) > 0) {
        availableOptions.push(q);
        allQuartersPaid = false;
        break;
      }
    }

    if (!allQuartersPaid) {
      availableOptions.push('Full Payment');
    }
  }

  // console.warn('Selected Student:', newVal);
  // console.warn('Downpayment:', payments.downpayment);
  // console.warn('Total Paid:', payments.totalPaid);
  // console.warn('Overall Balance:', balance);
  // console.warn('Remaining per Quarter:', remainingPerQuarter);
  // console.warn('Available Payment Option', availableOptions);

  return {
    selected_students: newVal,
    total_downpayment: payments.downpayment,
    total_paid: payments.totalPaid,
    overall_balance: balance,
    remaining_per_quarter: remainingPerQuarter,
    available_payment_option: availableOptions,
  };
}
