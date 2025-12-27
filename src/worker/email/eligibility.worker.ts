import { checkEmailEligibility } from "../../services/email/eligibility.service"
import { supabase } from "../../supabase"

export async function runEligibilityWorker(limit = 100) {
  const { data: leads } = await supabase
    .from('leads')
    .select('id, email')
    .eq('email_eligibility', 'pending')
    .limit(limit)

  for (const lead of leads || []) {
    const result = await checkEmailEligibility(lead.email)

    await supabase
      .from('leads')
      .update({
        email_eligibility: result.status,
        email_eligibility_reason: result.reason,
        email_checked_at: new Date().toISOString(),
      })
      .eq('id', lead.id)
  }
}
