export const getEligibilitySessionId = (data) =>
  data?.eligibility_session_id ??
  data?.eligibilitySessionId ??
  data?.session_id ??
  data?.sessionId ??
  null
