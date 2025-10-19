import { supabase } from '@/lib/supabase'
import type {
  VendorAccreditation,
  VendorAccreditationAuditLog,
  VendorApplicationPayload,
  VendorInduction,
  VendorProfile,
  VendorAccessLevel
} from '@/types/vendor'

export async function fetchVendorProfiles(): Promise<VendorProfile[]> {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .order('business_name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []) as VendorProfile[]
}

export async function fetchVendorAccessLevels(): Promise<VendorAccessLevel[]> {
  const { data, error } = await supabase
    .from('vendor_access_levels')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []) as VendorAccessLevel[]
}

export async function fetchVendorAccreditations(): Promise<VendorAccreditation[]> {
  const { data, error } = await supabase
    .from('vendor_accreditations')
    .select('*')
    .order('submitted_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const accreditations = (data || []) as VendorAccreditation[]
  if (accreditations.length === 0) {
    return []
  }

  const accreditationIds = accreditations.map((item) => item.id)

  const { data: joinRows, error: joinError } = await supabase
    .from('vendor_accreditation_access_levels')
    .select('accreditation_id, access_level_id')
    .in('accreditation_id', accreditationIds)

  if (joinError) {
    throw new Error(joinError.message)
  }

  const { data: levelRows, error: levelError } = await supabase
    .from('vendor_access_levels')
    .select('*')

  if (levelError) {
    throw new Error(levelError.message)
  }

  const levelMap = new Map((levelRows || []).map((level) => [level.id, level as VendorAccessLevel]))

  return accreditations.map((accreditation) => {
    const rows = (joinRows || []).filter((row) => row.accreditation_id === accreditation.id)
    return {
      ...accreditation,
      access_levels: rows
        .map((row) => levelMap.get(row.access_level_id)!)
        .filter((value): value is VendorAccessLevel => Boolean(value))
    }
  })
}

export async function fetchVendorInductions(vendorId: string): Promise<VendorInduction[]> {
  const { data, error } = await supabase
    .from('vendor_inductions')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []) as VendorInduction[]
}

export async function fetchVendorAuditLog(accreditationId: string): Promise<VendorAccreditationAuditLog[]> {
  const { data, error } = await supabase
    .from('vendor_accreditation_audit_logs')
    .select('*')
    .eq('accreditation_id', accreditationId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []) as VendorAccreditationAuditLog[]
}

export async function submitVendorApplication(payload: VendorApplicationPayload) {
  const { access_level_ids, notes, ...vendorFields } = payload
  const { data: vendorInsert, error: vendorError } = await supabase
    .from('vendors')
    .insert([{ ...vendorFields, notes: notes || null }])
    .select('*')
    .single()

  if (vendorError) {
    throw new Error(vendorError.message)
  }

  const vendor = vendorInsert as VendorProfile

  const { data: accreditationInsert, error: accreditationError } = await supabase
    .from('vendor_accreditations')
    .insert([{ vendor_id: vendor.id, status: 'pending', feedback: payload.notes || null }])
    .select('*')
    .single()

  if (accreditationError) {
    throw new Error(accreditationError.message)
  }

  const accreditation = accreditationInsert as VendorAccreditation

  if (access_level_ids?.length) {
    const rows = access_level_ids.map((access_level_id) => ({
      accreditation_id: accreditation.id,
      access_level_id
    }))
    const { error: joinError } = await supabase
      .from('vendor_accreditation_access_levels')
      .insert(rows)

    if (joinError) {
      throw new Error(joinError.message)
    }
  }

  return { vendor, accreditation }
}

export async function updateVendorAccreditationStatus(
  accreditationId: string,
  status: string,
  feedback?: string,
  actorProfileId?: string
) {
  const { error } = await supabase
    .from('vendor_accreditations')
    .update({ status, reviewed_at: new Date().toISOString(), feedback: feedback || null })
    .eq('id', accreditationId)

  if (error) {
    throw new Error(error.message)
  }

  await supabase
    .from('vendor_accreditation_audit_logs')
    .insert({
      accreditation_id: accreditationId,
      action: `status:${status}`,
      notes: feedback || null,
      actor_profile_id: actorProfileId || null
    })
}

export async function recordVendorInductionCompletion(inductionId: string, profileId?: string) {
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('vendor_inductions')
    .update({ completed_at: now, completed_by: profileId || null })
    .eq('id', inductionId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function issueVendorPass(accreditationId: string, passUrl: string, qrToken: string) {
  const { error } = await supabase
    .from('vendor_accreditations')
    .update({ digital_pass_url: passUrl, qr_code_token: qrToken })
    .eq('id', accreditationId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function refreshVendorAccreditationAccessLevels(accreditationId: string, accessLevelIds: string[]) {
  await supabase
    .from('vendor_accreditation_access_levels')
    .delete()
    .eq('accreditation_id', accreditationId)

  if (accessLevelIds.length === 0) {
    return
  }

  const rows = accessLevelIds.map((access_level_id) => ({
    accreditation_id: accreditationId,
    access_level_id
  }))

  const { error } = await supabase
    .from('vendor_accreditation_access_levels')
    .insert(rows)

  if (error) {
    throw new Error(error.message)
  }
}
