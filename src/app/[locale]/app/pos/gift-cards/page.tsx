import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'

export default async function GiftCardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('business_id')
    .eq('id', user.id)
    .single()

  if (!profile?.business_id) return null

  const { data: cards } = await supabase
    .from('gift_cards')
    .select(`
      *,
      customer:crm_customers(first_name, last_name, email)
    `)
    .eq('business_id', profile.business_id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gift Cards</h1>
        <p className="text-muted-foreground">Manage and track your business&apos;s digital gift cards.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Active Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cards?.filter(c => c.status === 'active').length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${cards?.reduce((sum, c) => sum + (c.status === 'active' ? Number(c.current_balance) : 0), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cards?.map((card) => (
                <TableRow key={card.id}>
                  <TableCell className="font-mono font-bold">{card.code}</TableCell>
                  <TableCell>
                    {card.customer ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{(card.customer as { first_name: string, last_name: string, email: string }).first_name} {(card.customer as { first_name: string, last_name: string, email: string }).last_name}</span>
                        <span className="text-xs text-muted-foreground">{(card.customer as { first_name: string, last_name: string, email: string }).email}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic text-xs">Guest Card</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold">${Number(card.current_balance).toFixed(2)}</span>
                      <span className="text-[10px] text-muted-foreground">Initial: ${Number(card.initial_balance).toFixed(2)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={card.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                      {card.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(card.created_at!), 'MMM d, yyyy')}
                  </TableCell>
                </TableRow>
              ))}
              {!cards?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No gift cards issued yet. Sell one from the POS!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
