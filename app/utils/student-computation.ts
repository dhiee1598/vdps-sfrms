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
    const amount = Number(item.amount);

    if (item.normalizedType === 'Downpayment') {
      payments.downpayment += amount;
      payments.totalPaid += amount;
    }
    else if (item.normalizedType in payments.perQuarterPaid) {
      payments.perQuarterPaid[item.normalizedType] += amount;
      payments.totalPaid += amount;
    }
  });

  const totalAmountDue = Number(newVal.total_amount_due);
  const balance = totalAmountDue - payments.totalPaid;
  const perQuarterAmount = (totalAmountDue - payments.downpayment) / 4;

  const quarters = ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter'];
  const remainingPerQuarter: any = {};
  let carryOver = 0;

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

  const availableOptions = [];
  const hasDownpayment = payments.downpayment > 0;

  if (!hasDownpayment) {
    availableOptions.push('Downpayment', 'Full Payment');
  }
  else {
    for (const q of quarters) {
      if (remainingPerQuarter[q] > 0) {
        availableOptions.push(q);
        break;
      }
    }
    availableOptions.push('Full Payment');
  }

  return {
    selected_students: newVal,
    total_downpayment: payments.downpayment,
    total_paid: payments.totalPaid,
    overall_balance: balance,
    remaining_per_quarter: remainingPerQuarter,
    available_payment_option: availableOptions,
  };
}
