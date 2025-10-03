// Billing data structures for reference (no validation)

// Billing configuration structure
export const billingConfigStructure = {
  billing_type: 'HOURLY|MONTHLY|PROJECT_BASED|TASK_BASED',
  hourly_rate: 'number (min 0)',
  monthly_salary: 'number (min 0)',
  project_fee: 'number (min 0)',
  memberRates: [
    {
      user_id: 'number (positive integer)',
      billing_type: 'HOURLY|MONTHLY',
      hourly_rate: 'number (min 0)',
      monthly_salary: 'number (min 0)'
    }
  ],
  taskRates: [
    {
      task_type: 'string',
      custom_rate: 'number (min 0)',
      description: 'string (optional)'
    }
  ]
};

// Invoice generation structure
export const invoiceGenerationStructure = {
  project_id: 'number (positive integer)',
  client_id: 'number (positive integer)',
  biller_id: 'number (positive integer)',
  start_date: 'ISO date string',
  end_date: 'ISO date string (greater than start_date)',
  project_client_id: 'number (positive integer, optional)'
};

// Invoice save structure
export const invoiceSaveStructure = {
  invoiceData: {
    project_id: 'number (positive integer)',
    client_id: 'number (positive integer)',
    biller_id: 'number (positive integer)',
    invoice_id: 'string',
    project_name: 'string',
    billing_period_start: 'ISO date string',
    billing_period_end: 'ISO date string',
    total_amount: 'number (min 0)',
    status: 'DRAFT|SENT|PAID|OVERDUE|CANCELLED',
    due_date: 'ISO date string',
    project_client_id: 'number (positive integer, optional)'
  },
  lineItems: [
    {
      item_type: 'TIME|MONTHLY_SALARY|PROJECT_FEE|TASK',
      description: 'string',
      quantity: 'number (min 0)',
      unit_rate: 'number (min 0)',
      total_amount: 'number (min 0)',
      user_id: 'number (positive integer, optional)',
      user_name: 'string (optional)',
      task_id: 'number (positive integer, optional)',
      time_entries: 'array of numbers (optional)',
      task_entries: 'array (optional)'
    }
  ]
};

// Case assignment structure
export const caseAssignmentStructure = {
  project_id: 'number (positive integer)',
  biller_id: 'number (positive integer)'
};

// Billing report structure
export const billingReportStructure = {
  start_date: 'ISO date string',
  end_date: 'ISO date string (greater than start_date)'
};

// Member billing calculation structure
export const memberBillingStructure = {
  user_id: 'number (positive integer)',
  project_id: 'number (positive integer)',
  start_date: 'ISO date string',
  end_date: 'ISO date string (greater than start_date)'
};

// Monthly billing calculation structure
export const monthlyBillingStructure = {
  user_id: 'number (positive integer)',
  project_id: 'number (positive integer)',
  month: 'number (0-11)',
  year: 'number (2020-2030)'
};

// Task billing calculation structure
export const taskBillingStructure = {
  project_id: 'number (positive integer)',
  start_date: 'ISO date string',
  end_date: 'ISO date string (greater than start_date)'
};

// Invoice status update structure
export const invoiceStatusUpdateStructure = {
  status: 'DRAFT|SENT|PAID|OVERDUE|CANCELLED'
};

// Parameter structures
export const parameterStructures = {
  project_id: 'number (positive integer)',
  user_id: 'number (positive integer)',
  task_id: 'number (positive integer)',
  invoice_id: 'number (positive integer)'
};

// Billing summary query structure
export const billingSummaryQueryStructure = {
  start_date: 'ISO date string (optional)',
  end_date: 'ISO date string (optional)'
}; 