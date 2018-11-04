import { Observable } from 'rxjs/Rx';
import { environment } from '../../environments/environment';
import { FolioRequestBase } from '../_common/request-base';
import { AddressDetail } from '../_common/address-detail';
import { PortalClientFactory, PortalResponse, PortalSession } from '../_services';
import { Injectable } from '@angular/core';

@Injectable()
export class TransactionsService {

  constructor(
    private clientFactory: PortalClientFactory,
    private session : PortalSession,
  ) { }

  getRentHistory(startDate: string, toDate: string) : Promise<RentHistoryInfoList> {
    const emptyRentHistoryList = new Promise<RentHistoryInfoList>((resolve, reject) => {
      resolve(null);
    });

    const client = this.clientFactory.createClient();
    const request = new GetRentHistory();
    request.FromDateString = startDate;
    request.ToDateString = toDate;
    if (client) {
      return client.get(request);
    } else {
      return emptyRentHistoryList;
    }
  }

  getTenantTransactionsList(): Promise<ReportData<TenantHistoryData>> {

    const emptyTenantList = new Promise<ReportData<TenantHistoryData>>((resolve, reject) => {
      resolve(null);
    });

    const client = this.clientFactory.createClient();
    const request = new GetTenantTransactionHistory();

    if (client) {
      return client.get(request);
    }else {
      return emptyTenantList;
    }
  }

  createTenantHistoryPdf(): Promise<TenantHistoryPdfStatus> {
        const emptyTenantList = new Promise<TenantHistoryPdfStatus>((resolve, reject) => {
          resolve(null);
        });

        const client = this.clientFactory.createClient();
        const request = new CreateTenantHistoryPdf ();
        request.FolioId = this.session.currentTenant.Id;

        if (client) {
          return client.post(request);
        }else {
          return emptyTenantList;
        }
  }

  getTenantPdfStatus() : Promise<TenantHistoryPdfStatus> {
    const emptyTenantList = new Promise<TenantHistoryPdfStatus>((resolve, reject) => {
      resolve(null);
    });

    const client = this.clientFactory.createClient();
    const request = new GetTenantHistoryPdfStatus();

    if (client) {
      return client.get(request);
    }else {
      return emptyTenantList;
    }
  }

  getTenantTransactionsHtml(): Promise<any> {
    const client = this.clientFactory.createClient();
    const request = new GetTenantTransactionHistoryReport();

    return client.get(request);
  }

  getTenantHistoryPdfUrl() {
    let pdfUrl = environment.serverUrl + 'tenants/' + this.session.currentTenant.Id + '/history-report-pdf';
    pdfUrl = pdfUrl + '?CustomerId=' + this.session.defaultAgent.Id;
    return pdfUrl;
  }

  getPdfDocumentUrl(documentId : string) {
    return environment.serverUrl + 'files/temp/' + documentId;
  }

  getTempDocumentUrl() {
      return environment.serverUrl + 'files/temp';
  }

  downloadPdf(window: Window) {
    const fileUrl = '/api/reports/getfile?FileKey=' +  'key';
    window.location.href = fileUrl;
  }
}

export class GetTenantTransactionHistory  extends FolioRequestBase<ReportData<TenantHistoryData>> {
   getTypeName() { return 'GetTenantTransactionHistory'; }
}

export class GetTenantHistoryPdf  extends FolioRequestBase<string> {
  getTypeName() { return 'GetTenantHistoryPdf'; }
}

export class GetTenantTransactionHistoryReport  extends FolioRequestBase<string> {
   getTypeName() { return 'GetTenantTransactionHistoryReport'; }
}

export class GetTenantHistoryPdfStatus  extends FolioRequestBase<TenantHistoryPdfStatus> {
  getTypeName() { return 'GetTenantHistoryPdfStatus'; }
}

export class CreateTenantHistoryPdf  extends FolioRequestBase<TenantHistoryPdfStatus> {
  getTypeName() { return 'CreateTenantHistoryPdf'; }
}


export class  TenantHistoryData {
  RentInformation : string;
  RentPaymentInformation : string;
  Statement : any ;
  Agent : CustomerSetting;
  Details: TenantHistoryAccountGroup;

  TenancyPeopleName : string;
  TenancyCompanyName : string;
  TenancyBalanceView : any;
  RentDailyRate : string;
  IsMonthly: boolean;
}

export class TenantHistoryAccountGroup {
  Title: string;
  OpeningBalance : number;
  ClosingBalance : number;
  GroupCredit : number;
  GroupDebit : number;
  Type : string;
  FolioCode : string;

  Transactions : TenantHistoryReportTransaction[];
}

export class TenantHistoryReportTransaction {
  TransactionDate : string;
  JournalNumber: number;
  LotReference: string;
  LedgerReference : string
  Type : string;
  Detail: string;
  Debit : number;
  Credit : number;
  Amount : number;
  Balance  : number;
  DaysInArrears : number;
  RentArrears : number;
  IsSameReceiptAsPrevious : boolean;
  Info : string[];
  ownershipId : string;
  PartPayment : number;
  PaidAmount : number;
  RentDueFromDate : string;
  RentDueToDate : string;
  IsReversalRelated : boolean;
}

export class ReportData<T> {
  Title: string;
  SubTitle: string;
  Agent : CustomerSetting;

  DataList: T[]
}

export class CustomerSetting {
  CompanyName : string;
  TradingName : string;

  Address: AddressDetail;
  LogoUrl: string;
  PersonName: string;
  Website: string;
  ABN: string;
  Email: string;
  Fax: string;
  Phone: string;

  StatementSetting : any;
}

export class GetRentHistory extends FolioRequestBase<RentHistoryInfoList> {
  FromDateString: string;
  ToDateString: string;
  getTypeName() { return 'GetRentHistory'; }
}

export class RentHistoryInfoList extends PortalResponse {
  List: RentHistoryInfo[];
}
export class RentHistoryInfo {
  Id : string;
  Amount : number;
  DueDate: Date;
}

export class TenantHistoryPdfStatus {
  FolioId : string;
  Status : string;
  TimeStamp : Date;
  DocumentStorageId : string;
}
