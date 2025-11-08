'use client'

/**
 * Single Sign-On (SSO) Integration Feature
 * Authenticate via AzureAD or Okta.
 * Available on: Command, Enterprise plans
 * Status: Implemented 2025-01-08
 */

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/Toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface SSOProvider {
  id: string
  name: string
  type: 'azure_ad' | 'okta' | 'saml'
  enabled: boolean
  client_id?: string
  client_secret?: string
  domain?: string
  metadata_url?: string
  callback_url: string
  created_at: string
}

export default function SSOIntegration() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [providers, setProviders] = useState<SSOProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<SSOProvider | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'azure_ad' as 'azure_ad' | 'okta' | 'saml',
    client_id: '',
    client_secret: '',
    domain: '',
    metadata_url: '',
  })

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      // In a real implementation, this would fetch from a database table
      // For now, we'll use a settings/configuration approach
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('key', 'sso_providers')
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" - that's okay
        console.error('Error fetching SSO providers:', error)
      }

      if (data?.value) {
        setProviders(JSON.parse(data.value))
      } else {
        setProviders([])
      }
    } catch (error) {
      console.error('Error fetching SSO providers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProvider = async () => {
    if (!formData.name || !formData.type) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required fields',
      })
      return
    }

    try {
      // Generate callback URL
      const callbackUrl = `${window.location.origin}/auth/callback`

      const newProvider: SSOProvider = {
        id: editingProvider?.id || `sso_${Date.now()}`,
        name: formData.name,
        type: formData.type,
        enabled: editingProvider?.enabled || false,
        client_id: formData.client_id || undefined,
        client_secret: formData.client_secret || undefined,
        domain: formData.domain || undefined,
        metadata_url: formData.metadata_url || undefined,
        callback_url: callbackUrl,
        created_at: editingProvider?.created_at || new Date().toISOString(),
      }

      const updatedProviders = editingProvider
        ? providers.map((p) => (p.id === editingProvider.id ? newProvider : p))
        : [...providers, newProvider]

      // Save to database (company_settings table)
      const { error } = await supabase
        .from('company_settings')
        .upsert({
          key: 'sso_providers',
          value: JSON.stringify(updatedProviders),
        })

      if (error) throw error

      setProviders(updatedProviders)
      setIsDialogOpen(false)
      setEditingProvider(null)
      setFormData({
        name: '',
        type: 'azure_ad',
        client_id: '',
        client_secret: '',
        domain: '',
        metadata_url: '',
      })

      showToast({
        type: 'success',
        title: 'SSO Provider Saved',
        message: `${editingProvider ? 'Updated' : 'Added'} SSO provider successfully`,
      })
    } catch (error) {
      console.error('Error saving SSO provider:', error)
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to save SSO provider',
      })
    }
  }

  const handleToggleProvider = async (providerId: string) => {
    try {
      const updatedProviders = providers.map((p) =>
        p.id === providerId ? { ...p, enabled: !p.enabled } : p
      )

      const { error } = await supabase
        .from('company_settings')
        .upsert({
          key: 'sso_providers',
          value: JSON.stringify(updatedProviders),
        })

      if (error) throw error

      setProviders(updatedProviders)
      showToast({
        type: 'success',
        title: 'Provider Updated',
        message: 'SSO provider status updated',
      })
    } catch (error) {
      console.error('Error toggling provider:', error)
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update provider',
      })
    }
  }

  const handleDeleteProvider = async (providerId: string) => {
    if (!confirm('Are you sure you want to delete this SSO provider?')) return

    try {
      const updatedProviders = providers.filter((p) => p.id !== providerId)

      const { error } = await supabase
        .from('company_settings')
        .upsert({
          key: 'sso_providers',
          value: JSON.stringify(updatedProviders),
        })

      if (error) throw error

      setProviders(updatedProviders)
      showToast({
        type: 'success',
        title: 'Provider Deleted',
        message: 'SSO provider has been removed',
      })
    } catch (error) {
      console.error('Error deleting provider:', error)
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete provider',
      })
    }
  }

  const handleEditProvider = (provider: SSOProvider) => {
    setEditingProvider(provider)
    setFormData({
      name: provider.name,
      type: provider.type,
      client_id: provider.client_id || '',
      client_secret: provider.client_secret || '',
      domain: provider.domain || '',
      metadata_url: provider.metadata_url || '',
    })
    setIsDialogOpen(true)
  }

  const handleNewProvider = () => {
    setEditingProvider(null)
    setFormData({
      name: '',
      type: 'azure_ad',
      client_id: '',
      client_secret: '',
      domain: '',
      metadata_url: '',
    })
    setIsDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SSO Integration</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configure Single Sign-On authentication with Azure AD, Okta, or SAML providers
          </p>
        </div>
        <Button onClick={handleNewProvider}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Provider
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                How SSO Works
              </h4>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>• Configure your identity provider (Azure AD, Okta, or SAML)</li>
                <li>• Users authenticate through your provider</li>
                <li>• Automatic user provisioning and role mapping</li>
                <li>• Secure token-based authentication</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Providers List */}
      {providers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No SSO providers configured
            </p>
            <Button onClick={handleNewProvider}>Add Your First Provider</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {providers.map((provider) => (
            <Card key={provider.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {provider.name}
                      </h3>
                      <Badge
                        className={
                          provider.enabled
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                        }
                      >
                        {provider.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Badge variant="outline">{provider.type.replace('_', ' ')}</Badge>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      {provider.domain && (
                        <div>
                          <span className="font-medium">Domain:</span> {provider.domain}
                        </div>
                      )}
                      {provider.client_id && (
                        <div>
                          <span className="font-medium">Client ID:</span>{' '}
                          {provider.client_id.substring(0, 20)}...
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Callback URL:</span>{' '}
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
                          {provider.callback_url}
                        </code>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleProvider(provider.id)}
                    >
                      {provider.enabled ? (
                        <XCircleIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                      )}
                      {provider.enabled ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditProvider(provider)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteProvider(provider.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProvider ? 'Edit SSO Provider' : 'Add SSO Provider'}
            </DialogTitle>
            <DialogDescription>
              Configure your identity provider settings for Single Sign-On
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Provider Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Company Azure AD"
              />
            </div>

            <div>
              <Label htmlFor="type">Provider Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'azure_ad' | 'okta' | 'saml') =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="azure_ad">Azure Active Directory</SelectItem>
                  <SelectItem value="okta">Okta</SelectItem>
                  <SelectItem value="saml">SAML 2.0</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.type !== 'saml' && (
              <>
                <div>
                  <Label htmlFor="client_id">Client ID</Label>
                  <Input
                    id="client_id"
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    placeholder="OAuth Client ID"
                  />
                </div>

                <div>
                  <Label htmlFor="client_secret">Client Secret</Label>
                  <Input
                    id="client_secret"
                    type="password"
                    value={formData.client_secret}
                    onChange={(e) => setFormData({ ...formData, client_secret: e.target.value })}
                    placeholder="OAuth Client Secret"
                  />
                </div>

                <div>
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    placeholder="e.g., company.com"
                  />
                </div>
              </>
            )}

            {formData.type === 'saml' && (
              <div>
                <Label htmlFor="metadata_url">Metadata URL</Label>
                <Input
                  id="metadata_url"
                  value={formData.metadata_url}
                  onChange={(e) => setFormData({ ...formData, metadata_url: e.target.value })}
                  placeholder="https://your-provider.com/saml/metadata"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProvider}>Save Provider</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
