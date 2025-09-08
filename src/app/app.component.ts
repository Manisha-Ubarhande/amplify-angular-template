import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';
import { AmplifyAuthenticatorModule, AuthenticatorService } from '@aws-amplify/ui-angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

Amplify.configure(outputs);

interface S3Object {
  name: string;
  type: 'folder' | 'file';
  size?: string;
  lastModified?: string;
  path: string;
  storageClass?: string;
}

interface BucketContent {
  [bucketName: string]: {
    [path: string]: S3Object[];
  };
}

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [
    AmplifyAuthenticatorModule,
    CommonModule,
    FormsModule,
  ],
})
export class AppComponent {
  bucketName = '';
  buckets: string[] = [
    'project-alpha-data',
    'customer-invoices-2024',
    'marketing-assets-global',
    'finance-reports-q2',
    'development-build-archives',
    'hr-documents-confidential', 
    'logs-web-server-prod',     
    'backup-database-snapshots',
    'public-website-assets',    
    'iot-sensor-data'           
  ];
  searchTerm: string = '';

  // Navigation state
  currentView: 'buckets' | 'objects' = 'buckets';
  currentBucket = '';
  currentPath = '';
  pathParts: string[] = [];

  isUploading = false;
  uploadProgress = 0;
  uploadStatus = '';
  selectedFile: File | null = null;
  selectedObjects: Set<string> = new Set();

  
  showConfirmationModal: boolean = false;
  confirmationMessage: string = '';
  confirmAction: (() => void) | null = null; 

  
  showCreateFolderModal: boolean = false;
  newFolderName: string = '';
  createFolderMessage: string = '';

  
  storageClasses = ['Standard', 'Standard-IA', 'One Zone-IA', 'Glacier', 'Glacier Deep Archive', 'Intelligent-Tiering'];

  
  bucketContents: BucketContent = {
    'project-alpha-data': {
      '': [
        { name: 'Specifications', type: 'folder', path: 'Specifications/', lastModified: 'Jan 10, 2024', storageClass: '-' },
        { name: 'Deliverables', type: 'folder', path: 'Deliverables/', lastModified: 'Feb 15, 2024', storageClass: '-' },
        { name: 'Research', type: 'folder', path: 'Research/', lastModified: 'Mar 20, 2024', storageClass: '-' },
        { name: 'Meeting-Notes', type: 'folder', path: 'Meeting-Notes/', lastModified: 'Apr 05, 2024', storageClass: '-' },
        { name: 'General_Documents', type: 'folder', path: 'General_Documents/', lastModified: 'Jan 02, 2024', storageClass: '-' }
      ],
      'Specifications/': [
        { name: 'Project_Alpha_V1.1.pdf', type: 'file', size: '2.5 MB', path: 'Specifications/Project_Alpha_V1.1.pdf', lastModified: 'Jan 10, 2024', storageClass: 'Standard' },
        { name: 'Technical_Requirements.docx', type: 'file', size: '850 KB', path: 'Specifications/Technical_Requirements.docx', lastModified: 'Jan 08, 2024', storageClass: 'Standard-IA' },
        { name: 'Security_Compliance_Guide.pdf', type: 'file', size: '1.2 MB', path: 'Specifications/Security_Compliance_Guide.pdf', lastModified: 'Jan 05, 2024', storageClass: 'Standard' },
        { name: 'Frontend_Design.sketch', type: 'file', size: '15 MB', path: 'Specifications/Frontend_Design.sketch', lastModified: 'Jan 12, 2024', storageClass: 'Standard' }, // Moved from Design_Docs
        { name: 'Backend_Architecture.drawio', type: 'file', size: '2.1 MB', path: 'Specifications/Backend_Architecture.drawio', lastModified: 'Jan 11, 2024', storageClass: 'Standard-IA' } // Moved from Design_Docs
      ],
      'Deliverables/': [
        { name: 'Phase1_Report.pdf', type: 'file', size: '5.1 MB', path: 'Deliverables/Phase1_Report.pdf', lastModified: 'Feb 15, 2024', storageClass: 'Standard' },
        { name: 'Component_Diagrams.pptx', type: 'file', size: '3.2 MB', path: 'Deliverables/Component_Diagrams.pptx', lastModified: 'Feb 12, 2024', storageClass: 'Standard' },
        { name: 'Testing_Results_Summary.xlsx', type: 'file', size: '150 KB', path: 'Deliverables/Testing_Results_Summary.xlsx', lastModified: 'Feb 10, 2024', storageClass: 'Standard-IA' },
        { name: 'Q1_Client_Deck.pptx', type: 'file', size: '7.8 MB', path: 'Deliverables/Q1_Client_Deck.pptx', lastModified: 'Feb 20, 2024', storageClass: 'Standard' }, // Moved from Client_Presentations
        { name: 'Demo_Video.mp4', type: 'file', size: '25.5 MB', path: 'Deliverables/Demo_Video.mp4', lastModified: 'Feb 18, 2024', storageClass: 'Intelligent-Tiering' } // Moved from Client_Presentations
      ],
      'Research/': [
        { name: 'Market_Analysis_Q1_2024.pdf', type: 'file', size: '4.8 MB', path: 'Research/Market_Analysis_Q1_2024.pdf', lastModified: 'Mar 20, 2024', storageClass: 'Standard' },
        { name: 'Competitor_Review.pptx', type: 'file', size: '1.9 MB', path: 'Research/Competitor_Review.pptx', lastModified: 'Mar 18, 2024', storageClass: 'Standard' },
        { name: 'User_Feedback_Summary.xlsx', type: 'file', size: '300 KB', path: 'Research/User_Feedback_Summary.xlsx', lastModified: 'Mar 15, 2024', storageClass: 'Standard-IA' },
        { name: 'Customer_Demographics.csv', type: 'file', size: '1.1 MB', path: 'Research/Customer_Demographics.csv', lastModified: 'Mar 22, 2024', storageClass: 'Standard-IA' }, // Moved from Data_Sets
        { name: 'Sales_Trends.json', type: 'file', size: '800 KB', path: 'Research/Sales_Trends.json', lastModified: 'Mar 21, 2024', storageClass: 'Standard' } // Moved from Data_Sets
      ],
      'Meeting-Notes/': [
        { name: 'Daily_Standup_04_04_2024.txt', type: 'file', size: '12 KB', path: 'Meeting-Notes/Daily_Standup_04_04_2024.txt', lastModified: 'Apr 04, 2024', storageClass: 'One Zone-IA' },
        { name: 'Client_Review_04_01_2024.pdf', type: 'file', size: '500 KB', path: 'Meeting-Notes/Client_Review_04_01_2024.pdf', lastModified: 'Apr 01, 2024', storageClass: 'Standard' },
        { name: 'Q1_Board_Minutes.pdf', type: 'file', size: '1.5 MB', path: 'Meeting-Notes/Q1_Board_Minutes.pdf', lastModified: 'Apr 10, 2024', storageClass: 'Standard' }, // Moved from Board_Meetings
        { name: 'Annual_Strategy_Review.pptx', type: 'file', size: '6.2 MB', path: 'Meeting-Notes/Annual_Strategy_Review.pptx', lastModified: 'Apr 09, 2024', storageClass: 'Standard' } // Moved from Board_Meetings
      ],
      'General_Documents/': [
        { name: 'Project_Plan_2024.pdf', type: 'file', size: '1.8 MB', path: 'General_Documents/Project_Plan_2024.pdf', lastModified: 'Jan 01, 2024', storageClass: 'Standard' },
        { name: 'Team_Contact_List.xlsx', type: 'file', size: '50 KB', path: 'General_Documents/Team_Contact_List.xlsx', lastModified: 'Jan 02, 2024', storageClass: 'Standard' }
      ]
    },
    'customer-invoices-2024': {
      '': [
        { name: 'January', type: 'folder', path: 'January/', lastModified: 'Feb 01, 2024', storageClass: '-' },
        { name: 'February', type: 'folder', path: 'February/', lastModified: 'Mar 01, 2024', storageClass: '-' },
        { name: 'March', type: 'folder', path: 'March/', lastModified: 'Apr 01, 2024', storageClass: '-' },
        { name: 'Q1-Summaries', type: 'folder', path: 'Q1-Summaries/', lastModified: 'Apr 10, 2024', storageClass: '-' },
        { name: 'April', type: 'folder', path: 'April/', lastModified: 'May 01, 2024', storageClass: '-' },
        { name: 'Templates', type: 'folder', path: 'Templates/', lastModified: 'Jan 01, 2024', storageClass: '-' }
      ],
      'January/': [
        { name: 'INV_C001_20240105.pdf', type: 'file', size: '180 KB', path: 'January/INV_C001_20240105.pdf', lastModified: 'Jan 05, 2024', storageClass: 'Standard-IA' },
        { name: 'INV_C002_20240110.pdf', type: 'file', size: '210 KB', path: 'January/INV_C002_20240110.pdf', lastModified: 'Jan 10, 2024', storageClass: 'Standard-IA' },
        { name: 'INV_C003_20240115.pdf', type: 'file', size: '195 KB', path: 'January/INV_C003_20240115.pdf', lastModified: 'Jan 15, 2024', storageClass: 'Standard-IA' },
        { name: 'Receipt_001.jpg', type: 'file', size: '350 KB', path: 'January/Receipt_001.jpg', lastModified: 'Jan 06, 2024', storageClass: 'One Zone-IA' }
      ],
      'February/': [
        { name: 'INV_C004_20240201.pdf', type: 'file', size: '220 KB', path: 'February/INV_C004_20240201.pdf', lastModified: 'Feb 01, 2024', storageClass: 'Standard-IA' },
        { name: 'INV_C005_20240210.pdf', type: 'file', size: '175 KB', path: 'February/INV_C005_20240210.pdf', lastModified: 'Feb 10, 2024', storageClass: 'Standard-IA' },
        { name: 'Statement_Feb.pdf', type: 'file', size: '450 KB', path: 'February/Statement_Feb.pdf', lastModified: 'Feb 28, 2024', storageClass: 'Standard' }
      ],
      'March/': [
        { name: 'INV_C006_20240305.pdf', type: 'file', size: '200 KB', path: 'March/INV_C006_20240305.pdf', lastModified: 'Mar 05, 2024', storageClass: 'Standard-IA' },
        { name: 'INV_C007_20240312.pdf', type: 'file', size: '230 KB', path: 'March/INV_C007_20240312.pdf', lastModified: 'Mar 12, 2024', storageClass: 'Standard-IA' },
        { name: 'Audit_Log_March.txt', type: 'file', size: '50 KB', path: 'March/Audit_Log_March.txt', lastModified: 'Mar 31, 2024', storageClass: 'One Zone-IA' }
      ],
      'April/': [
        { name: 'INV_C008_20240401.pdf', type: 'file', size: '190 KB', path: 'April/INV_C008_20240401.pdf', lastModified: 'Apr 01, 2024', storageClass: 'Standard-IA' },
        { name: 'INV_C009_20240410.pdf', type: 'file', size: '205 KB', path: 'April/INV_C009_20240410.pdf', lastModified: 'Apr 10, 2024', storageClass: 'Standard-IA' }
      ],
      'Q1-Summaries/': [
        { name: 'Q1_Invoice_Summary.xlsx', type: 'file', size: '345 KB', path: 'Q1-Summaries/Q1_Invoice_Summary.xlsx', lastModified: 'Apr 10, 2024', storageClass: 'Standard' },
        { name: 'Q1_Revenue_Report.pdf', type: 'file', size: '1.5 MB', path: 'Q1-Summaries/Q1_Revenue_Report.pdf', lastModified: 'Apr 09, 2024', storageClass: 'Standard' },
        { name: 'Q1_Customer_Feedback.docx', type: 'file', size: '250 KB', path: 'Q1-Summaries/Q1_Customer_Feedback.docx', lastModified: 'Apr 08, 2024', storageClass: 'Standard' }
      ],
      'Templates/': [
        { name: 'Invoice_Template.pdf', type: 'file', size: '100 KB', path: 'Templates/Invoice_Template.pdf', lastModified: 'Jan 01, 2024', storageClass: 'Standard' }
      ]
    },
    'marketing-assets-global': {
      '': [
        { name: 'Campaign-2024-Q3', type: 'folder', path: 'Campaign-2024-Q3/', lastModified: 'May 01, 2024', storageClass: '-' },
        { name: 'Brand-Guidelines', type: 'folder', path: 'Brand-Guidelines/', lastModified: 'Apr 25, 2024', storageClass: '-' },
        { name: 'Product-Launches', type: 'folder', path: 'Product-Launches/', lastModified: 'Mar 15, 2024', storageClass: '-' },
        { name: 'Stock_Photos', type: 'folder', path: 'Stock_Photos/', lastModified: 'Jun 01, 2024', storageClass: '-' },
        { name: 'Strategic_Documents', type: 'folder', path: 'Strategic_Documents/', lastModified: 'Jan 01, 2024', storageClass: '-' }
      ],
      'Campaign-2024-Q3/': [
        { name: 'Social_Media_Pack.zip', type: 'file', size: '12.8 MB', path: 'Campaign-2024-Q3/Social_Media_Pack.zip', lastModified: 'May 01, 2024', storageClass: 'Standard' },
        { name: 'Ad_Creatives_Set_A.psd', type: 'file', size: '8.5 MB', path: 'Campaign-2024-Q3/Ad_Creatives_Set_A.psd', lastModified: 'Apr 29, 2024', storageClass: 'Standard' },
        { name: 'Press_Release_Draft.docx', type: 'file', size: '300 KB', path: 'Campaign-2024-Q3/Press_Release_Draft.docx', lastModified: 'Apr 28, 2024', storageClass: 'Standard-IA' },
        { name: 'Promo_Video_1.mp4', type: 'file', size: '35.0 MB', path: 'Campaign-2024-Q3/Promo_Video_1.mp4', lastModified: 'May 05, 2024', storageClass: 'Intelligent-Tiering' }, // Moved from Video_Ads
        { name: 'Short_Clip_A.mov', type: 'file', size: '18.2 MB', path: 'Campaign-2024-Q3/Short_Clip_A.mov', lastModified: 'May 04, 2024', storageClass: 'Standard' } // Moved from Video_Ads
      ],
      'Brand-Guidelines/': [
        { name: 'Logo_Usage_Guide.pdf', type: 'file', size: '4.1 MB', path: 'Brand-Guidelines/Logo_Usage_Guide.pdf', lastModified: 'Apr 25, 2024', storageClass: 'Standard' },
        { name: 'Color_Palette.ai', type: 'file', size: '1.2 MB', path: 'Brand-Guidelines/Color_Palette.ai', lastModified: 'Apr 24, 2024', storageClass: 'Standard' },
        { name: 'Typography_Guide.pdf', type: 'file', size: '900 KB', path: 'Brand-Guidelines/Typography_Guide.pdf', lastModified: 'Apr 23, 2024', storageClass: 'Standard-IA' }
      ],
      'Product-Launches/': [
        { name: 'Launch_Plan_2024_ProductX.pdf', type: 'file', size: '3.5 MB', path: 'Product-Launches/Launch_Plan_2024_ProductX.pdf', lastModified: 'Mar 15, 2024', storageClass: 'Standard-IA' },
        { name: 'Key_Visuals_ProductY.zip', type: 'file', size: '25.6 MB', path: 'Product-Launches/Key_Visuals_ProductY.zip', lastModified: 'Mar 12, 2024', storageClass: 'Intelligent-Tiering' },
        { name: 'Press_Kit_ProductZ.zip', type: 'file', size: '18.0 MB', path: 'Product-Launches/Press_Kit_ProductZ.zip', lastModified: 'Mar 10, 2024', storageClass: 'Standard' }
      ],
      'Stock_Photos/': [
        { name: 'Office_Team.jpg', type: 'file', size: '2.5 MB', path: 'Stock_Photos/Office_Team.jpg', lastModified: 'Jun 01, 2024', storageClass: 'Standard' },
        { name: 'City_Skyline.jpg', type: 'file', size: '3.1 MB', path: 'Stock_Photos/City_Skyline.jpg', lastModified: 'May 30, 2024', storageClass: 'Standard' }
      ],
      'Strategic_Documents/': [
        { name: 'Marketing_Strategy_2024.pptx', type: 'file', size: '10.2 MB', path: 'Strategic_Documents/Marketing_Strategy_2024.pptx', lastModified: 'Jan 01, 2024', storageClass: 'Standard' }
      ]
    },
    'finance-reports-q2': {
      '': [
        { name: 'April-Data', type: 'folder', path: 'April-Data/', lastModified: 'May 05, 2024', storageClass: '-' },
        { name: 'May-Data', type: 'folder', path: 'May-Data/', lastModified: 'Jun 05, 2024', storageClass: '-' },
        { name: 'Quarterly-Summaries', type: 'folder', path: 'Quarterly-Summaries/', lastModified: 'Jul 01, 2024', storageClass: '-' },
        { name: 'Financial_Planning', type: 'folder', path: 'Financial_Planning/', lastModified: 'Jan 15, 2024', storageClass: '-' }
      ],
      'April-Data/': [
        { name: 'Sales_Data_202404.xlsx', type: 'file', size: '1.8 MB', path: 'April-Data/Sales_Data_202404.xlsx', lastModified: 'May 05, 2024', storageClass: 'Standard' },
        { name: 'Expense_Report_April.pdf', type: 'file', size: '750 KB', path: 'April-Data/Expense_Report_April.pdf', lastModified: 'May 04, 2024', storageClass: 'Standard-IA' },
        { name: 'Payroll_April.pdf', type: 'file', size: '900 KB', path: 'April-Data/Payroll_April.pdf', lastModified: 'May 03, 2024', storageClass: 'Standard-IA' }
      ],
      'May-Data/': [
        { name: 'Budget_Analysis_May.xlsx', type: 'file', size: '2.1 MB', path: 'May-Data/Budget_Analysis_May.xlsx', lastModified: 'Jun 05, 2024', storageClass: 'Standard' },
        { name: 'Revenue_Projections_May.pdf', type: 'file', size: '900 KB', path: 'May-Data/Revenue_Projections_May.pdf', lastModified: 'Jun 04, 2024', storageClass: 'Standard-IA' },
        { name: 'Investment_Portfolio_May.pdf', type: 'file', size: '1.2 MB', path: 'May-Data/Investment_Portfolio_May.pdf', lastModified: 'Jun 03, 2024', storageClass: 'Standard' }
      ],
      'Quarterly-Summaries/': [
        { name: 'Q2_Financial_Overview.pptx', type: 'file', size: '4.5 MB', path: 'Quarterly-Summaries/Q2_Financial_Overview.pptx', lastModified: 'Jul 01, 2024', storageClass: 'Standard' },
        { name: 'Q2_Audit_Readiness.pdf', type: 'file', size: '2.8 MB', path: 'Quarterly-Summaries/Q2_Audit_Readiness.pdf', lastModified: 'Jun 28, 2024', storageClass: 'Standard-IA' },
        { name: 'Investor_Briefing_Q2.pdf', type: 'file', size: '3.1 MB', path: 'Quarterly-Summaries/Investor_Briefing_Q2.pdf', lastModified: 'Jun 27, 2024', storageClass: 'Standard' }
      ],
      'Financial_Planning/': [
        { name: 'Budget_2024_Forecast.xlsx', type: 'file', size: '780 KB', path: 'Financial_Planning/Budget_2024_Forecast.xlsx', lastModified: 'Jan 15, 2024', storageClass: 'Standard' }
      ]
    },
    'development-build-archives': {
      '': [
        { name: 'Release-V1.0', type: 'folder', path: 'Release-V1.0/', lastModified: 'Mar 01, 2024', storageClass: '-' },
        { name: 'Release-V1.1', type: 'folder', path: 'Release-V1.1/', lastModified: 'Apr 01, 2024', storageClass: '-' },
        { name: 'Dev-Snapshots', type: 'folder', path: 'Dev-Snapshots/', lastModified: 'Jul 20, 2024', storageClass: '-' },
        { name: 'Hotfixes', type: 'folder', path: 'Hotfixes/', lastModified: 'Jul 22, 2024', storageClass: '-' },
        { name: 'Root_Docs', type: 'folder', path: 'Root_Docs/', lastModified: 'Jan 01, 2024', storageClass: '-' }
      ],
      'Release-V1.0/': [
        { name: 'App_Build_1.0.0_Package.zip', type: 'file', size: '150 MB', path: 'Release-V1.0/App_Build_1.0.0_Package.zip', lastModified: 'Mar 01, 2024', storageClass: 'Glacier' },
        { name: 'Source_Code_V1.0.tar.gz', type: 'file', size: '80 MB', path: 'Release-V1.0/Source_Code_V1.0.tar.gz', lastModified: 'Feb 28, 2024', storageClass: 'Glacier Deep Archive' },
        { name: 'Docker_Images_V1.0.tar', type: 'file', size: '200 MB', path: 'Release-V1.0/Docker_Images_V1.0.tar', lastModified: 'Feb 27, 2024', storageClass: 'Glacier' }
      ],
      'Release-V1.1/': [
        { name: 'App_Build_1.1.0_Package.zip', type: 'file', size: '160 MB', path: 'Release-V1.1/App_Build_1.1.0_Package.zip', lastModified: 'Apr 01, 2024', storageClass: 'Glacier' },
        { name: 'Release_Notes_V1.1.pdf', type: 'file', size: '50 KB', path: 'Release-V1.1/Release_Notes_V1.1.pdf', lastModified: 'Mar 30, 2024', storageClass: 'Standard' },
        { name: 'API_Docs_V1.1.zip', type: 'file', size: '2.5 MB', path: 'Release-V1.1/API_Docs_V1.1.zip', lastModified: 'Mar 29, 2024', storageClass: 'Standard-IA' }
      ],
      'Dev-Snapshots/': [
        { name: 'Snapshot_20240720_1430.zip', type: 'file', size: '250 MB', path: 'Dev-Snapshots/Snapshot_20240720_1430.zip', lastModified: 'Jul 20, 2024', storageClass: 'Intelligent-Tiering' },
        { name: 'Snapshot_20240719_1000.zip', type: 'file', size: '245 MB', path: 'Dev-Snapshots/Snapshot_20240719_1000.zip', lastModified: 'Jul 19, 2024', storageClass: 'Intelligent-Tiering' },
        { name: 'Snapshot_20240718_0900.zip', type: 'file', size: '240 MB', path: 'Dev-Snapshots/Snapshot_20240718_0900.zip', lastModified: 'Jul 18, 2024', storageClass: 'Intelligent-Tiering' }
      ],
      'Hotfixes/': [
        { name: 'Bugfix_123.patch', type: 'file', size: '10 KB', path: 'Hotfixes/Bugfix_123.patch', lastModified: 'Jul 22, 2024', storageClass: 'Standard' },
        { name: 'Security_Patch_A.zip', type: 'file', size: '500 KB', path: 'Hotfixes/Security_Patch_A.zip', lastModified: 'Jul 21, 2024', storageClass: 'Standard' }
      ],
      'Root_Docs/': [
        { name: 'README.md', type: 'file', size: '5 KB', path: 'Root_Docs/README.md', lastModified: 'Jan 01, 2024', storageClass: 'Standard' }
      ]
    },
    
    'hr-documents-confidential': {
      '': [
        { name: 'Employee_Records', type: 'folder', path: 'Employee_Records/', lastModified: 'Jul 15, 2024', storageClass: '-' },
        { name: 'Policies', type: 'folder', path: 'Policies/', lastModified: 'Jun 10, 2024', storageClass: '-' },
        { name: 'Onboarding_Kits', type: 'folder', path: 'Onboarding_Kits/', lastModified: 'May 20, 2024', storageClass: '-' },
        { name: 'Annual_Reports', type: 'folder', path: 'Annual_Reports/', lastModified: 'Apr 01, 2024', storageClass: '-' }
      ],
      'Employee_Records/': [
        { name: 'John_Doe_Profile.pdf', type: 'file', size: '300 KB', path: 'Employee_Records/John_Doe_Profile.pdf', lastModified: 'Jul 15, 2024', storageClass: 'Standard' },
        { name: 'Jane_Smith_Contract.pdf', type: 'file', size: '250 KB', path: 'Employee_Records/Jane_Smith_Contract.pdf', lastModified: 'Jul 10, 2024', storageClass: 'Standard-IA' },
        { name: 'Performance_Reviews_2023.xlsx', type: 'file', size: '1.5 MB', path: 'Employee_Records/Performance_Reviews_2023.xlsx', lastModified: 'Jul 01, 2024', storageClass: 'Standard' }
      ],
      'Policies/': [
        { name: 'Company_Handbook_V2.pdf', type: 'file', size: '1.1 MB', path: 'Policies/Company_Handbook_V2.pdf', lastModified: 'Jun 10, 2024', storageClass: 'Standard' },
        { name: 'Privacy_Policy.pdf', type: 'file', size: '400 KB', path: 'Policies/Privacy_Policy.pdf', lastModified: 'Jun 05, 2024', storageClass: 'Standard-IA' }
      ],
      'Onboarding_Kits/': [
        { name: 'New_Hire_Checklist.docx', type: 'file', size: '80 KB', path: 'Onboarding_Kits/New_Hire_Checklist.docx', lastModified: 'May 20, 2024', storageClass: 'Standard' },
        { name: 'Benefits_Guide.pdf', type: 'file', size: '700 KB', path: 'Onboarding_Kits/Benefits_Guide.pdf', lastModified: 'May 18, 2024', storageClass: 'Standard' }
      ],
      'Annual_Reports/': [
        { name: 'HR_Annual_Report_2023.pdf', type: 'file', size: '2.3 MB', path: 'Annual_Reports/HR_Annual_Report_2023.pdf', lastModified: 'Apr 01, 2024', storageClass: 'Standard' },
        { name: 'Diversity_Report_2023.pdf', type: 'file', size: '1.8 MB', path: 'Annual_Reports/Diversity_Report_2023.pdf', lastModified: 'Mar 28, 2024', storageClass: 'Standard-IA' }
      ]
    },
    'logs-web-server-prod': {
      '': [
        { name: 'Access_Logs', type: 'folder', path: 'Access_Logs/', lastModified: 'Jul 25, 2024', storageClass: '-' },
        { name: 'Error_Logs', type: 'folder', path: 'Error_Logs/', lastModified: 'Jul 24, 2024', storageClass: '-' },
        { name: 'Application_Logs', type: 'folder', path: 'Application_Logs/', lastModified: 'Jul 23, 2024', storageClass: '-' },
        { name: 'Old_Logs_Archive', type: 'folder', path: 'Old_Logs_Archive/', lastModified: 'Jan 01, 2024', storageClass: '-' }
      ],
      'Access_Logs/': [
        { name: 'access_log_2024-07-25.txt', type: 'file', size: '15.2 MB', path: 'Access_Logs/access_log_2024-07-25.txt', lastModified: 'Jul 25, 2024', storageClass: 'Standard-IA' },
        { name: 'access_log_2024-07-24.txt', type: 'file', size: '14.8 MB', path: 'Access_Logs/access_log_2024-07-24.txt', lastModified: 'Jul 24, 2024', storageClass: 'Standard-IA' }
      ],
      'Error_Logs/': [
        { name: 'error_log_2024-07-24.txt', type: 'file', size: '2.1 MB', path: 'Error_Logs/error_log_2024-07-24.txt', lastModified: 'Jul 24, 2024', storageClass: 'Standard' },
        { name: 'error_log_2024-07-23.txt', type: 'file', size: '1.9 MB', path: 'Error_Logs/error_log_2024-07-23.txt', lastModified: 'Jul 23, 2024', storageClass: 'Standard' }
      ],
      'Application_Logs/': [
        { name: 'app_log_2024-07-23.json', type: 'file', size: '5.5 MB', path: 'Application_Logs/app_log_2024-07-23.json', lastModified: 'Jul 23, 2024', storageClass: 'Standard-IA' },
        { name: 'app_log_2024-07-22.json', type: 'file', size: '5.1 MB', path: 'Application_Logs/app_log_2024-07-22.json', lastModified: 'Jul 22, 2024', storageClass: 'Standard-IA' }
      ],
      'Old_Logs_Archive/': [
        { name: '2023_Q4_Logs.zip', type: 'file', size: '150 MB', path: 'Old_Logs_Archive/2023_Q4_Logs.zip', lastModified: 'Jan 01, 2024', storageClass: 'Glacier' },
        { name: '2023_Q3_Logs.zip', type: 'file', size: '145 MB', path: 'Old_Logs_Archive/2023_Q3_Logs.zip', lastModified: 'Oct 01, 2023', storageClass: 'Glacier Deep Archive' }
      ]
    },
    'backup-database-snapshots': {
      '': [
        { name: 'Daily_Backups', type: 'folder', path: 'Daily_Backups/', lastModified: 'Jul 25, 2024', storageClass: '-' },
        { name: 'Weekly_Backups', type: 'folder', path: 'Weekly_Backups/', lastModified: 'Jul 20, 2024', storageClass: '-' },
        { name: 'Monthly_Backups', type: 'folder', path: 'Monthly_Backups/', lastModified: 'Jul 01, 2024', storageClass: '-' }
      ],
      'Daily_Backups/': [
        { name: 'db_snapshot_20240725.bak', type: 'file', size: '500 MB', path: 'Daily_Backups/db_snapshot_20240725.bak', lastModified: 'Jul 25, 2024', storageClass: 'Standard-IA' },
        { name: 'db_snapshot_20240724.bak', type: 'file', size: '498 MB', path: 'Daily_Backups/db_snapshot_20240724.bak', lastModified: 'Jul 24, 2024', storageClass: 'Standard-IA' }
      ],
      'Weekly_Backups/': [
        { name: 'db_snapshot_week_29.bak', type: 'file', size: '1.2 GB', path: 'Weekly_Backups/db_snapshot_week_29.bak', lastModified: 'Jul 20, 2024', storageClass: 'One Zone-IA' },
        { name: 'db_snapshot_week_28.bak', type: 'file', size: '1.1 GB', path: 'Weekly_Backups/db_snapshot_week_28.bak', lastModified: 'Jul 13, 2024', storageClass: 'One Zone-IA' }
      ],
      'Monthly_Backups/': [
        { name: 'db_snapshot_month_07.bak', type: 'file', size: '3.5 GB', path: 'Monthly_Backups/db_snapshot_month_07.bak', lastModified: 'Jul 01, 2024', storageClass: 'Glacier' },
        { name: 'db_snapshot_month_06.bak', type: 'file', size: '3.4 GB', path: 'Monthly_Backups/db_snapshot_month_06.bak', lastModified: 'Jun 01, 2024', storageClass: 'Glacier Deep Archive' }
      ]
    },
    'public-website-assets': {
      '': [
        { name: 'images', type: 'folder', path: 'images/', lastModified: 'Jul 10, 2024', storageClass: '-' },
        { name: 'css', type: 'folder', path: 'css/', lastModified: 'Jul 05, 2024', storageClass: '-' },
        { name: 'js', type: 'folder', path: 'js/', lastModified: 'Jul 05, 2024', storageClass: '-' },
        { name: 'Web_Pages', type: 'folder', path: 'Web_Pages/', lastModified: 'Jul 10, 2024', storageClass: '-' }
      ],
      'images/': [
        { name: 'logo.png', type: 'file', size: '50 KB', path: 'images/logo.png', lastModified: 'Jul 10, 2024', storageClass: 'Standard' },
        { name: 'hero_banner.jpg', type: 'file', size: '2.1 MB', path: 'images/hero_banner.jpg', lastModified: 'Jul 09, 2024', storageClass: 'Standard' },
        { name: 'product_showcase.zip', type: 'file', size: '10.5 MB', path: 'images/product_showcase.zip', lastModified: 'Jul 07, 2024', storageClass: 'Standard' }
      ],
      'css/': [
        { name: 'style.css', type: 'file', size: '25 KB', path: 'css/style.css', lastModified: 'Jul 05, 2024', storageClass: 'Standard' },
        { name: 'theme.css', type: 'file', size: '18 KB', path: 'css/theme.css', lastModified: 'Jul 04, 2024', storageClass: 'Standard' }
      ],
      'js/': [
        { name: 'main.js', type: 'file', size: '30 KB', path: 'js/main.js', lastModified: 'Jul 05, 2024', storageClass: 'Standard' },
        { name: 'animations.js', type: 'file', size: '12 KB', path: 'js/animations.js', lastModified: 'Jul 03, 2024', storageClass: 'Standard' }
      ],
      'Web_Pages/': [
        { name: 'index.html', type: 'file', size: '15 KB', path: 'Web_Pages/index.html', lastModified: 'Jul 10, 2024', storageClass: 'Standard' },
        { name: 'about.html', type: 'file', size: '10 KB', path: 'Web_Pages/about.html', lastModified: 'Jul 08, 2024', storageClass: 'Standard' }
      ]
    },
    'iot-sensor-data': {
      '': [
        { name: 'Temperature_Sensors', type: 'folder', path: 'Temperature_Sensors/', lastModified: 'Jul 25, 2024', storageClass: '-' },
        { name: 'Humidity_Sensors', type: 'folder', path: 'Humidity_Sensors/', lastModified: 'Jul 25, 2024', storageClass: '-' },
        { name: 'Pressure_Sensors', type: 'folder', path: 'Pressure_Sensors/', lastModified: 'Jul 25, 2024', storageClass: '-' },
        { name: 'Device_Firmware', type: 'folder', path: 'Device_Firmware/', lastModified: 'Jun 01, 2024', storageClass: '-' }
      ],
      'Temperature_Sensors/': [
        { name: 'temp_data_2024-07-25.csv', type: 'file', size: '5.1 MB', path: 'Temperature_Sensors/temp_data_2024-07-25.csv', lastModified: 'Jul 25, 2024', storageClass: 'Intelligent-Tiering' },
        { name: 'temp_data_2024-07-24.csv', type: 'file', size: '4.9 MB', path: 'Temperature_Sensors/temp_data_2024-07-24.csv', lastModified: 'Jul 24, 2024', storageClass: 'Intelligent-Tiering' }
      ],
      'Humidity_Sensors/': [
        { name: 'humidity_data_2024-07-25.csv', type: 'file', size: '3.2 MB', path: 'Humidity_Sensors/humidity_data_2024-07-25.csv', lastModified: 'Jul 25, 2024', storageClass: 'Intelligent-Tiering' },
        { name: 'humidity_data_2024-07-24.csv', type: 'file', size: '3.0 MB', path: 'Humidity_Sensors/humidity_data_2024-07-24.csv', lastModified: 'Jul 24, 2024', storageClass: 'Intelligent-Tiering' }
      ],
      'Pressure_Sensors/': [
        { name: 'pressure_data_2024-07-25.csv', type: 'file', size: '2.8 MB', path: 'Pressure_Sensors/pressure_data_2024-07-25.csv', lastModified: 'Jul 25, 2024', storageClass: 'Intelligent-Tiering' },
        { name: 'pressure_data_2024-07-24.csv', type: 'file', size: '2.7 MB', path: 'Pressure_Sensors/pressure_data_2024-07-24.csv', lastModified: 'Jul 24, 2024', storageClass: 'Intelligent-Tiering' }
      ],
      'Device_Firmware/': [
        { name: 'firmware_v1.0.bin', type: 'file', size: '1.5 MB', path: 'Device_Firmware/firmware_v1.0.bin', lastModified: 'Jun 01, 2024', storageClass: 'Standard' },
        { name: 'firmware_v1.1.bin', type: 'file', size: '1.6 MB', path: 'Device_Firmware/firmware_v1.1.bin', lastModified: 'Jun 15, 2024', storageClass: 'Standard' }
      ]
    }
  };

  constructor(
    public authenticator: AuthenticatorService,
    private router: Router
  ) {}

  async signOut() {
    try {
      await this.authenticator.signOut();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  
  selectBucketRadio(bucket: string) {
    this.bucketName = bucket;
    console.log('Selected bucket radio:', this.bucketName);
  }

  
  navigateToBucket(bucket: string) {
    this.bucketName = bucket;
    this.currentBucket = bucket;
    this.currentPath = '';
    this.pathParts = [];
    this.currentView = 'objects';
    this.selectedObjects.clear();
    console.log('Navigated to bucket:', this.currentBucket, 'view:', this.currentView);
  }

  handleRowClick(obj: S3Object, event: MouseEvent) {
    
    if (obj.type === 'folder') {
      this.currentPath = obj.path;
      this.updatePathParts();
      this.selectedObjects.clear();
    } else {
      
      this.toggleObjectSelection(obj.path, null);
    }
  }

  toggleObjectSelection(path: string, event: Event | null) {
    if (event) {
      event.stopPropagation();
    }

    if (this.selectedObjects.has(path)) {
      this.selectedObjects.delete(path);
    } else {
      this.selectedObjects.add(path);
    }
  }

  isObjectSelected(path: string): boolean {
    return this.selectedObjects.has(path);
  }

  
  hasSelectedItems(): boolean {
    return this.selectedObjects.size > 0;
  }

  
  hasSelectedFiles(): boolean {
    if (this.selectedObjects.size === 0) return false;
    const currentObjects = this.getCurrentObjects();
    for (const path of this.selectedObjects) {
      const obj = currentObjects.find(o => o.path === path);
      if (obj && obj.type === 'file') {
        return true;
      }
    }
    return false;
  }

  isAllSelected(): boolean {
    const currentObjects = this.getCurrentObjects();
    if (currentObjects.length === 0) return false;

    return currentObjects.every(obj => this.selectedObjects.has(obj.path));
  }

  isSomeSelected(): boolean {
    const currentObjects = this.getCurrentObjects();
    if (currentObjects.length === 0) return false;

    const selectedCount = currentObjects.filter(obj => this.selectedObjects.has(obj.path)).length;
    return selectedCount > 0 && selectedCount < currentObjects.length;
  }

  toggleSelectAll(event: Event) {
    const target = event.target as HTMLInputElement;
    const currentObjects = this.getCurrentObjects();

    if (target.checked) {
      
      currentObjects.forEach(obj => this.selectedObjects.add(obj.path));
    } else {
      
      currentObjects.forEach(obj => this.selectedObjects.delete(obj.path));
    }
  }

  navigateToPath(pathIndex: number) {
    if (pathIndex === -1) {

      this.currentPath = '';
      this.pathParts = [];
    } else {
      
      const newPath = this.pathParts.slice(0, pathIndex + 1).join('/') + '/';
      this.currentPath = newPath;
      this.updatePathParts();
    }
    this.selectedObjects.clear();
  }

  navigateToBuckets() {
    this.currentView = 'buckets';
    this.currentBucket = '';
    this.currentPath = '';
    this.pathParts = [];
    this.bucketName = '';
    this.selectedObjects.clear();
  }

  private updatePathParts() {
    if (this.currentPath) {
      this.pathParts = this.currentPath.split('/').filter(part => part.length > 0);
    } else {
      this.pathParts = [];
    }
  }

  getCurrentObjects(): S3Object[] {
    if (!this.currentBucket || !this.bucketContents[this.currentBucket]) {
      return [];
    }

    const objects = this.bucketContents[this.currentBucket][this.currentPath] || [];

    
    return objects.sort((a, b) => {
      if (a.type === 'folder' && b.type === 'file') {
        return -1;
      }
      if (a.type === 'file' && b.type === 'folder') {
        return 1;
      }
      return a.name.localeCompare(b.name);
    }).filter(obj =>
      obj.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  onRefresh() {
    console.log('Refreshing...');
    this.selectedObjects.clear();
    
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.uploadStatus = `Selected: ${file.name}`;
    }
  }

  onUpload() {
    if (this.currentView === 'buckets' || !this.currentBucket) {
      console.error('Please select a bucket first to upload.');
      this.showCustomMessage('Please select a bucket first to upload.');
      return;
    }

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.onchange = (event: any) => {
      this.onFileSelected(event);
      if (this.selectedFile) {
        this.performUpload();
      }
    };
    fileInput.click();
  }

  private performUpload() {
    if (!this.selectedFile) return;

    this.isUploading = true;
    this.uploadProgress = 0;
    this.uploadStatus = `Uploading ${this.selectedFile.name} to ${this.currentBucket}/${this.currentPath}...`;

    const uploadSimulation = setInterval(() => {
      this.uploadProgress += Math.random() * 15;

      if (this.uploadProgress >= 100) {
        this.uploadProgress = 100;
        this.isUploading = false;
        this.uploadStatus = `Successfully uploaded ${this.selectedFile!.name}`;

        
        const newFile: S3Object = {
          name: this.selectedFile!.name,
          type: 'file',
          size: this.formatFileSize(this.selectedFile!.size),
          path: this.currentPath + this.selectedFile!.name,
          lastModified: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          storageClass: 'Standard'
        };

        if (!this.bucketContents[this.currentBucket][this.currentPath]) {
          this.bucketContents[this.currentBucket][this.currentPath] = [];
        }
        this.bucketContents[this.currentBucket][this.currentPath].push(newFile);

        clearInterval(uploadSimulation);

        setTimeout(() => {
          this.uploadStatus = '';
          this.uploadProgress = 0;
          this.selectedFile = null;
        }, 3000);
      }
    }, 200);

    console.log('Upload to bucket:', this.currentBucket, 'Path:', this.currentPath, 'File:', this.selectedFile.name);
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  onDownload() {
    if (this.currentView === 'buckets' || !this.currentBucket) {
      console.error('Please select a bucket first to download.');
      this.showCustomMessage('Please select a bucket first to download.');
      return;
    }

    if (!this.hasSelectedFiles()) {
      console.error('Please select one or more files to download.');
      this.showCustomMessage('Please select one or more files to download.');
      return;
    }

    const selectedPaths = Array.from(this.selectedObjects);
    const currentObjects = this.getCurrentObjects();

    selectedPaths.forEach(path => {
      const objToDownload = currentObjects.find(obj => obj.path === path);
      if (objToDownload && objToDownload.type === 'file') {
        
        const fileContent = `This is a simulated download for the file: ${objToDownload.name}\n\nPath: ${objToDownload.path}\nSize: ${objToDownload.size}\nLast Modified: ${objToDownload.lastModified}`;
        const blob = new Blob([fileContent], { type: 'text/plain' }); 

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = objToDownload.name; 
        document.body.appendChild(a);
        a.click(); 
        document.body.removeChild(a); 
        window.URL.revokeObjectURL(url); 

        console.log(`Downloading: ${objToDownload.name}`);
      } else if (objToDownload && objToDownload.type === 'folder') {
        this.showCustomMessage(`Cannot download folder "${objToDownload.name}". Please select files.`);
      }
    });

    if (selectedPaths.length === 1) {
      this.showCustomMessage(`Downloading: ${selectedPaths[0].split('/').pop()}`);
    } else {
      this.showCustomMessage(`Downloading ${selectedPaths.length} selected files.`);
    }

    this.selectedObjects.clear(); 
  }

  onDelete() {
    if (this.currentView === 'buckets') {
      if (!this.bucketName) {
        this.showCustomMessage('Please select a bucket to delete.');
        return;
      }
      this.confirmationMessage = `Are you sure you want to delete the bucket "${this.bucketName}"? This action cannot be undone.`;
      this.confirmAction = () => {
        this.deleteSelectedBucket();
        this.showCustomMessage(`Bucket "${this.bucketName}" deleted successfully.`);
      };
      this.showConfirmationModal = true;
    } else { 
      if (!this.hasSelectedItems()) {
        console.error('Please select one or more objects to delete.');
        this.showCustomMessage('Please select one or more objects to delete.');
        return;
      }

      const selectedPaths = Array.from(this.selectedObjects);
      const selectedObjects = this.getCurrentObjects().filter(obj =>
        selectedPaths.includes(obj.path)
      );

      let message = '';
      if (selectedObjects.length === 1) {
        message = `Are you sure you want to delete "${selectedObjects[0].name}"? This action cannot be undone.`;
      } else {
        message = `Are you sure you want to delete ${selectedObjects.length} objects? This action cannot be undone.`;
      }

      
      this.confirmationMessage = message;
      this.confirmAction = () => {
        this.deleteObjects(selectedPaths);
        this.showCustomMessage(`${selectedObjects.length} object(s) deleted successfully.`);
      };
      this.showConfirmationModal = true;
    }
  }

  private deleteObjects(paths: string[]) {
    const objects = this.bucketContents[this.currentBucket][this.currentPath];

    paths.forEach(path => {
      const index = objects.findIndex(obj => obj.path === path);
      if (index > -1) {
        const obj = objects[index];
        objects.splice(index, 1);

        
        if (obj.type === 'folder') {
          Object.keys(this.bucketContents[this.currentBucket]).forEach(bucketPath => {
            if (bucketPath.startsWith(obj.path)) {
              delete this.bucketContents[this.currentBucket][bucketPath];
            }
          });
        }
      }
    });

    this.selectedObjects.clear();
    console.log('Objects deleted:', paths);
  }

  
  deleteSelectedBucket() {
    const bucketToDelete = this.bucketName;
    if (bucketToDelete) {
      
      this.buckets = this.buckets.filter(b => b !== bucketToDelete);
      
      delete this.bucketContents[bucketToDelete];

      
      this.navigateToBuckets();
    }
  }

  
  executeConfirmation() {
    if (this.confirmAction) {
      this.confirmAction();
    }
    this.cancelConfirmation();
  }

  
  cancelConfirmation() {
    this.showConfirmationModal = false;
    this.confirmationMessage = '';
    this.confirmAction = null;
  }

  
  showCustomMessage(message: string) {
    this.uploadStatus = message; 
    setTimeout(() => {
      this.uploadStatus = '';
    }, 3000);
  }

  
  onCopyArn() {
    if (!this.bucketName) {
      this.showCustomMessage('Please select a bucket to copy its ARN.');
      return;
    }
    const arn = `arn:aws:s3:::${this.bucketName}`;
    
    const el = document.createElement('textarea');
    el.value = arn;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    
    console.log('Copied ARN:', arn);
  }

  
  onEmptyBucket() {
    
    console.error('Empty bucket action is disabled.');
    this.showCustomMessage('Empty bucket action is disabled.');
    return;
  }

 
  onCreateFolder() {
    if (!this.currentBucket) {
      this.showCustomMessage('Please navigate into a bucket to create a folder.');
      console.warn('Attempted to create folder without navigating into a bucket.');
      return;
    }
    console.log('Opening create folder modal for bucket:', this.currentBucket, 'path:', this.currentPath);
    this.newFolderName = ''; 
    this.createFolderMessage = ''; 
    this.showCreateFolderModal = true;
  }

  
  confirmCreateFolder() {
    const folderName = this.newFolderName.trim();
    if (!folderName) {
      this.createFolderMessage = 'Folder name cannot be empty.';
      console.error('Folder creation failed: Name empty.');
      return;
    }

    
    if (folderName.includes('/') || folderName.includes('\\')) {
      this.createFolderMessage = 'Folder name cannot contain slashes.';
      console.error('Folder creation failed: Name contains slashes.');
      return;
    }

    const fullPath = this.currentPath + folderName + '/';

    
    const currentObjects = this.bucketContents[this.currentBucket][this.currentPath] || [];
    const isDuplicate = currentObjects.some(
      (obj) => obj.name === folderName && obj.type === 'folder'
    );

    if (isDuplicate) {
      this.createFolderMessage = `A folder named "${folderName}" already exists.`;
      console.error('Folder creation failed: Duplicate name.');
      return;
    }

    
    const newFolder: S3Object = {
      name: folderName,
      type: 'folder',
      path: fullPath,
      lastModified: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      storageClass: '-',
    };

    if (!this.bucketContents[this.currentBucket][this.currentPath]) {
      this.bucketContents[this.currentBucket][this.currentPath] = [];
    }
    this.bucketContents[this.currentBucket][this.currentPath].push(newFolder);

    
    this.bucketContents[this.currentBucket][fullPath] = [];


    this.showCustomMessage(`Folder "${folderName}" created successfully.`);
    console.log('Created folder:', newFolder);
    console.log('Updated bucketContents for current path:', this.bucketContents[this.currentBucket][this.currentPath]);
    console.log('New folder path initialized:', this.bucketContents[this.currentBucket][fullPath]);
    this.cancelCreateFolder(); 
  }

  
  cancelCreateFolder() {
    this.showCreateFolderModal = false;
    this.newFolderName = '';
    this.createFolderMessage = '';
  }

  
  onCopyS3Uri() {
    if (!this.hasSelectedItems()) {
      this.showCustomMessage('Please select one or more items to copy S3 URI.');
      console.warn('Attempted to copy S3 URI with no items selected.');
      return;
    }

    const selectedPaths = Array.from(this.selectedObjects);
    const s3Uris = selectedPaths.map(path => `s3://${this.currentBucket}/${path}`);
    const textToCopy = s3Uris.join('\n');

    this.copyToClipboard(textToCopy);
    
    console.log('Copied S3 URI(s):', s3Uris);
  }

 
  onCopyUrl() {
    if (!this.hasSelectedItems()) { 
      this.showCustomMessage('Please select one or more items to copy URL.');
      console.warn('Attempted to copy URL with no items selected.');
      return;
    }

    const selectedPaths = Array.from(this.selectedObjects);
    const currentObjects = this.getCurrentObjects();
    const urls: string[] = [];

    selectedPaths.forEach(path => {
      const obj = currentObjects.find(o => o.path === path);
      if (obj) { 
        if (obj.type === 'file') {
          
          urls.push(`https://${this.currentBucket}.s3.us-east-1.amazonaws.com/${path}`);
        } else if (obj.type === 'folder') {
          
          urls.push(`https://${this.currentBucket}.s3.us-east-1.amazonaws.com/${path}`);
        }
      }
    });

    if (urls.length === 0) {
      this.showCustomMessage('No items selected to copy URL.');
      console.warn('No items found among selected items to copy URL.');
      return;
    }

    const textToCopy = urls.join('\n');
    this.copyToClipboard(textToCopy);
    
    console.log('Copied URL(s):', urls);
  }

  
  onActions() {
    
    this.showCustomMessage(`Actions clicked for ${this.selectedObjects.size} selected item(s).`);
    console.log('Actions button clicked for selected objects:', Array.from(this.selectedObjects));
    
  }

  
  private copyToClipboard(text: string) {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }

  
  get isDeleteButtonDisabled(): boolean {
    if (this.currentView === 'buckets') {
      return !this.bucketName; 
    } else if (this.currentView === 'objects') {
      return !this.hasSelectedItems(); 
    }
    return true; 
  }

  filteredBuckets(): string[] {
    if (!this.searchTerm.trim()) {
      return this.buckets;
    }
    return this.buckets.filter(bucket =>
      bucket.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  getRandomDate(): string {
    const dates = [
      'Dec 15, 2023',
      'Jan 22, 2024',
      'Feb 8, 2024',
      'Mar 3, 2024',
      'Apr 17, 2024',
      'May 12, 2024',
      'Jun 01, 2024',
      'Jul 25, 2024',
      'Aug 10, 2023',
      'Sep 05, 2024',
      'Oct 18, 2023',
      'Nov 20, 2024'
    ];
    return dates[Math.floor(Math.random() * dates.length)];
  }
}
