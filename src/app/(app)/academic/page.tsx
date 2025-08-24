// src/app/(app)/academic/page.tsx
"use client";

import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import CourseList from '../../../components/CourseList';
import StudyBuddyFinder from '../../../components/StudyBuddyFinder';
import ProfessorReview from '../../../components/ProfessorReview';

export default function AcademicPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Academic</h1>
      <Tabs>
        <TabList>
          <Tab>Courses</Tab>
          <Tab>Study Buddy Finder</Tab>
          <Tab>Professor/Course Reviews</Tab>
        </TabList>

        <TabPanel>
          <CourseList />
        </TabPanel>
        <TabPanel>
          <StudyBuddyFinder />
        </TabPanel>
        <TabPanel>
          <ProfessorReview />
        </TabPanel>
      </Tabs>
    </div>
  );
}