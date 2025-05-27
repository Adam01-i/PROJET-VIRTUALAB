import { useState } from 'react';
import AdminProfesseur from './AdminProfesseur';
import AdminEleve from './AdminEleve';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../ui/tabs';

export default function AdminUser() {
  const [tab, setTab] = useState('professeurs');

  return (
    <div className="mt-20 px-4 md:px-8 py-6">
      <Tabs defaultValue={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="professeurs" className="text-sm md:text-base">
            Professeurs
          </TabsTrigger>
          <TabsTrigger value="eleves" className="text-sm md:text-base">
            Élèves
          </TabsTrigger>
        </TabsList>

        <TabsContent value="professeurs">
          <AdminProfesseur embedded />
        </TabsContent>
        <TabsContent value="eleves">
          <AdminEleve embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}
