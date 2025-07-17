import { useState } from 'react';
import AdminProfesseur from './AdminProfesseur';
import AdminEleve from './AdminEleve';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../ui/tabs';

export default function AdminUser() {
  const [tab, setTab] = useState('professeurs');

  return (
    <div className="mt-15 px-4 sm:px-6 md:px-8 py-2 max-w-screen-xl mx-auto">      

      <Tabs defaultValue={tab} onValueChange={setTab} className="w-full">
        <TabsList
          className="flex flex-col sm:flex-row justify-center items-center gap-4"
          aria-label="Navigation entre les rôles utilisateur"
        >
          <TabsTrigger
            value="professeurs"
            className="text-sm md:text-base px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition-all data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
          >
            Professeurs
          </TabsTrigger>
          <TabsTrigger
            value="eleves"
            className="text-sm md:text-base px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100 transition-all data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
          >
            Élèves
          </TabsTrigger>
        </TabsList>

        <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 md:p-2">
          <TabsContent value="professeurs">
            <AdminProfesseur embedded />
          </TabsContent>
          <TabsContent value="eleves">
            <AdminEleve embedded />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
