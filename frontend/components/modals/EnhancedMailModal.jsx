import React from 'react';
import { Mail, X, Plus, Inbox } from 'lucide-react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarFallback } from '../ui/avatar';
import moment from 'moment';
import { formatEmailBody } from '../formatEmail';
import DOMPurify from 'dompurify';

// Enhanced Mail Modal Component
export const EnhancedMailModal = ({
  isOpen,
  onClose,
  mails,
  mailLoading,
  selectedMail,
  setSelectedMail,
  onNewMail,
  onLoadMore,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-6 h-6 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-800">Mail Center</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={onNewMail}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Mail
                </Button>
                <button
                  onClick={onClose}
                  className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-[85vh] overflow-y-auto p-6">
            {selectedMail ? (
              // Mail Detail View
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedMail(null)}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Back to Inbox
                  </Button>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar>
                      <AvatarFallback>{selectedMail.from?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{selectedMail.from}</h3>
                      <p className="text-sm text-gray-600">{selectedMail.to}</p>
                    </div>
                    <div className="ml-auto text-sm text-gray-500">
                      {moment(selectedMail.date).format('MMM DD, YYYY HH:mm')}
                    </div>
                  </div>

                  <h2 className="text-xl font-semibold mb-4">{selectedMail.subject}</h2>
                  <div className="prose max-w-none">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(formatEmailBody(selectedMail.body, selectedMail.subject), {
                          ADD_ATTR: ['target'],
                          ALLOWED_TAGS: ['div', 'p', 'h1', 'h2', 'h3', 'strong', 'a', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'br'],
                          ALLOWED_ATTR: ['class', 'href', 'target']
                        })
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              // Mail List View
              <div className="space-y-6">
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="all" className="flex items-center gap-2">
                      <Inbox className="w-4 h-4" />
                      All ({mails.length})
                    </TabsTrigger>
                    <TabsTrigger value="inbox" className="flex items-center gap-2">
                      <Inbox className="w-4 h-4" />
                      Inbox ({mails.filter(mail => mail.to?.includes('mananrajpout258@gmail.com')).length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="mt-6">
                    {mailLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : mails.length > 0 ? (
                      <div className="space-y-4">
                        {mails.map((mail, index) => (
                          <div
                            key={index}
                            onClick={() => setSelectedMail(mail)}
                            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-gray-800">{mail.subject}</h3>
                              <span className="text-sm text-gray-500">
                                {moment(mail.date).format('MMM DD, HH:mm')}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>From: {mail.from}</span>
                              <span>To: {mail.to}</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                              {mail.body?.replace(/<[^>]*>/g, '').substring(0, 150)}...
                            </p>
                          </div>
                        ))}
                        <div className="text-center">
                          <Button
                            onClick={onLoadMore}
                            disabled={mailLoading}
                            variant="outline"
                            className="mt-4"
                          >
                            {mailLoading ? 'Loading...' : 'Load More'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">No Mails Found</h3>
                        <p className="text-gray-500">No emails found in your mailbox.</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="inbox" className="mt-6">
                    {mailLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : mails.filter(mail => mail.to?.includes('mananrajpout258@gmail.com')).length > 0 ? (
                      <div className="space-y-4">
                        {mails.filter(mail => mail.to?.includes('mananrajpout258@gmail.com')).map((mail, index) => (
                          <div
                            key={index}
                            onClick={() => setSelectedMail(mail)}
                            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-gray-800">{mail.subject}</h3>
                              <span className="text-sm text-gray-500">
                                {moment(mail.date).format('MMM DD, HH:mm')}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>From: {mail.from}</span>
                              <span>To: {mail.to}</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                              {mail.body?.replace(/<[^>]*>/g, '').substring(0, 150)}...
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">No Inbox Mails</h3>
                        <p className="text-gray-500">No emails in your inbox.</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
