import { setTimeout } from 'timers';
import {
    ReportData,
    TenantHistoryData,
    TenantHistoryPdfStatus,
    TenantHistoryReportTransaction,
    TransactionsService,
} from '../transactions.service';
import * as moment from 'moment';
import { Moment } from 'moment';
import * as momenttz from 'moment-timezone';
import { PortalSession } from '../../_common/portal-session';
import { LocalDatePipe } from '../../_pipes/local-date';
import { Component, OnInit } from '@angular/core';
import {AgentInfo} from '../../agent-card/services/agent.service';

@Component({
  selector: 'app-transaction-history',
  templateUrl: './transaction-history.component.html',
  styleUrls: ['./transaction-history.component.scss']
})
export class TransactionHistoryComponent implements OnInit {
  transactionHistory : ReportData<TenantHistoryData>;
  transactions : TenantHistoryReportTransaction[];
  isLoaded = false;
  showMessage = false;
  hasPdfReport = false;
  pdfDocumentId = null;
  pdfTimeStamp = null;
  isPending = false;
  pdfStatus : TenantHistoryPdfStatus;
  errMessage : string;
  showCreateReportButton = true;
  agentInfo: AgentInfo;
  sameDayReport = true;
  localtimezone = null;
  isClosed  : boolean;

  constructor(
    private transactionService : TransactionsService,
    private portalSession: PortalSession
  ) { }

  ngOnInit() {
      const that = this;
      that.agentInfo =  that.portalSession.defaultAgent;
      that.showMessage = false;

      that.isClosed = false;
      if (that.portalSession && this.portalSession.currentTenant) {
          that.isClosed = this.portalSession.currentTenant.IsClosed;
      }
      this.transactions = null;
      this.transactionService.getTenantTransactionsList()
        .then(r => {
          that.prepareTransactions(r);
          that.isLoaded = true;
        })
        .catch(err => {
            that.isLoaded = true;
            if (err && err.responseStatus && err.responseStatus.message) {
                that.showMessage = true;
                console.log(err.responseStatus.message.replace('api',''));
                that.errMessage = 'The transaction service is not available now';
            }
        }
      );

      this.refreshTenantPdfStatus();
  }

  refreshTenantPdfStatus() {
    if (!this.hasPdfReport) {

    const that = this;
    this.transactionService.getTenantPdfStatus()
    .then(r => {
      if (r && r.Status) {
        if (r.DocumentStorageId && r.Status === 'Done') {
          that.pdfDocumentId = r.DocumentStorageId;
          this.pdfTimeStamp = r.TimeStamp;
          this.showCreateButton();
          that.isPending = false;
          that.hasPdfReport = true;
          that.pdfStatus = r;
        }else {
            that.isPending = true;
            setTimeout( () => this.refreshTenantPdfStatus(), 1500);
        }
      }else {
        that.isPending = false;
      }
    });
  }
  }

  createPdfReport() {
    this.pdfStatus = null;
    this.hasPdfReport = false;
    this.pdfDocumentId = null;

    const that = this;
    this.transactionService.createTenantHistoryPdf()
    .then(r => {
      if (r && r.DocumentStorageId && r.Status === 'Done') {
        that.pdfDocumentId = r.DocumentStorageId;
        that.hasPdfReport = true;
          this.pdfTimeStamp = r.TimeStamp;
          this.showCreateButton();
        that.isPending = false;
        that.pdfStatus = r;
      }else {
        that.pdfDocumentId = null;
        that.hasPdfReport = false;
        that.isPending = true;

        that.refreshTenantPdfStatus();
      }
    })
    .catch(err => {
    });
  }

  showCreateButton() {
      if (this.pdfTimeStamp) {
          // timestamp is utc time, convert the datetime to local time
          this.pdfTimeStamp = moment(this.pdfTimeStamp).local().format('YYYY-MM-DD HH:mm:ss');
          this.localtimezone = momenttz.tz.guess();
          const duration = moment.duration(moment().diff(moment(this.pdfTimeStamp))).asMinutes();
          this.showCreateReportButton = duration > 30;
          this.sameDayReport = moment(this.pdfTimeStamp).date() === moment().date();


      }

  }

  downloadPdf() {
    const folioId = this.portalSession.session.CurrentFolioId;

    if (folioId) {
        const pdfUrl = this.transactionService.getTempDocumentUrl();

        window.location.href = pdfUrl + '?FileName=Tenant History Report&FileType=pdf&FolioId=' + folioId;
    } else {
        this.showMessage = true;
        this.errMessage = 'Invalid folio access';
    }
  }

  private prepareTransactions (response : ReportData<TenantHistoryData>) {
    this.isLoaded = true;
    this.transactionHistory = response;
    if (response.DataList && response.DataList.length > 0 && response.DataList[0].Details.Transactions.length > 0) {
      let transactions = response.DataList[0].Details.Transactions;

      if (!transactions || transactions.length === 0) {
          this.showMessage = true;
          this.errMessage = 'There have been no transactions recorded.';
      }

      // filter out reversal and reversed transactions
      transactions = transactions.filter(t => {
        return !t.IsReversalRelated;
      });

      transactions = transactions.reverse();
      this.mergeActivityFeeds(transactions, this);
    } else {
        this.showMessage = true;
        this.errMessage = 'There have been no transactions recorded.';
    }
  }

  private mergeActivityFeeds (transactions : TenantHistoryReportTransaction[], that: TransactionHistoryComponent) {
    const mergedTransactions = new Array<MergedTransaction>();

    if (transactions) {
      let previousTransaction : MergedTransaction = null;
      transactions.forEach(function(transaction, i) {
        if (that.shouldMergeTransaction(previousTransaction, transaction)) {
          previousTransaction.list.push(transaction);
        }else {
          previousTransaction = Object.assign(new MergedTransaction(), transaction);
          previousTransaction.list = [transaction];
          mergedTransactions.push(previousTransaction);
        }
      });
    }

    this.transactions = mergedTransactions;
  }

  shouldMergeTransaction(previousTransaction: MergedTransaction, transaction : TenantHistoryReportTransaction) {
    if (previousTransaction && transaction) {
      if ( transaction && transaction.JournalNumber &&
         previousTransaction && previousTransaction.JournalNumber &&
         previousTransaction.JournalNumber === transaction.JournalNumber
        // lastFeed.FeedInfo['JournalId'] === currentFeed.FeedInfo['JournalId']
      ) {
        return true;
      }
    }
    return false;
  }

  openReport(url: string) {
    window.open(url, 'pm_print_report');
  }
}

class MergedTransaction extends TenantHistoryReportTransaction {
  list : TenantHistoryReportTransaction[];
}
