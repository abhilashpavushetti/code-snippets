import { api, LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

import { getRecord, getFieldValue } from "lightning/uiRecordApi";
import CONTACT_ID from "@salesforce/schema/User.ContactId";
import ACCOUNT_ID from "@salesforce/schema/User.AccountId";
import USER_ID from '@salesforce/user/Id'

import displayPurchaseOrderNumbers from '@salesforce/apex/rmaPurchaseOrderController.displayPurchaseOrderNumbers';
import getSelectedPurchaseOrders from '@salesforce/apex/rmaPurchaseOrderController.getSelectedPurchaseOrders';
import getCaseData from '@salesforce/apex/rmaPurchaseOrderController.getCaseData';
import getCollectionAddress from '@salesforce/apex/rmaPurchaseOrderController.getCollectionAddress';
import createCaseLineItem from '@salesforce/apex/rmaPurchaseOrderController.createCaseLineItem';

import { createRecord } from 'lightning/uiRecordApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import Case_Object from '@salesforce/schema/Case';
import CaseLineItem_Object from '@salesforce/schema/R4C_Case_Line_Item__c';
import { getPicklistValuesByRecordType } from 'lightning/uiObjectInfoApi';

import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadStyle } from 'lightning/platformResourceLoader';
import COLORS from '@salesforce/resourceUrl/colors';

import START_DATE from '@salesforce/label/c.r4c_allowance_start_date';
import END_DATE from '@salesforce/label/c.r4c_customer_allowance_end_date_validation';

export default class RmaPurchaseOrder extends NavigationMixin(LightningElement) {

    label = {
        START_DATE,
        END_DATE,
    };
    canSubmitCase = true
    isCssLoaded = false;
    @track LoginAccount_Name;
    @track POrecords;
    @track step1 = true;
    
    @track proceedStep2 = true;
    @track proceedStep3 = true;

    @track disableTbl = false;

    @track dispSpinner = false;
    @track showBtn = false;

    @api recId;

    @track selectedPO = [];
    @track rmarecord=null;
    POdataTable;

    @track columns = [
        {label:'PO#', fieldName:'PO_Number__c', type:'text', innerWidth:120, cellAttributes: 
        { class: 'slds-text-color_success slds-text-title_caps slds-color__background_gray-5'},wrapText: true
    },
        {label:'PO Date', fieldName:'PO_Date__c',type:'date', innerWidth:120, cellAttributes: 
        { class: 'slds-text-color_success slds-text-title_caps slds-color__background_gray-5'}
    },
        //{label:'SO#', fieldName:'SO__c', type:'text', innerWidth:120},
        {label:'Line Item', fieldName:'Line_Item__c', type:'text', innerWidth:120, cellAttributes: 
        { class: 'slds-text-color_success slds-text-title_caps slds-color__background_gray-5'}
    },
        //{label:'Sold To', fieldName:'Sold_To__c', type:'text', innerWidth:120},
        //{label:'Ship To', fieldName:'Ship_To__c', type:'text', innerWidth:120},
        //{label:'Intel Product Name', fieldName:'Intel_Product_Name__c', type:'text', innerWidth:120},
        {label:'Intel Part Number', fieldName:'Stocking_ID__c', type:'text', innerWidth:120, cellAttributes: 
        { class: 'slds-text-color_success slds-text-title_caps slds-color__background_gray-5'}
    },
        {label:'Customer Part Numner', fieldName:'Customer_Part_Number__c', type:'text', innerWidth:120, cellAttributes: 
        { class: 'slds-text-color_success slds-text-title_caps slds-color__background_gray-5'}
    },
        //{label:'Quantity', fieldName:'Quantity__c', type:'text', innerWidth:120},
        {label:'Billed Quantity', fieldName:'Billed_Quantity__c',type:'text', innerWidth:120, cellAttributes: 
        { class: 'slds-text-color_success slds-text-title_caps slds-color__background_gray-5'}
    },
    {label:'Return Reason', fieldName:'reasonOpt',type:'picklist', cellAttributes: 
        { class: 'slds-text-color_success slds-color__background_gray-5'},
            typeAttributes:
            {
                options:{fieldName:'setReturnReasonOpt'},
                pickListPlaceholder:'Select Return Reason'
            },
            innerWidth:120,wrapText: true
    },

        {label:'Remedy', fieldName:'remedyOpt',type:'picklist', cellAttributes: 
        { class: 'slds-text-color_success slds-color__background_gray-5'},
            typeAttributes:
            {
                options:{fieldName:'setRemedyOpt'},
                pickListPlaceholder:'Select Remedy'
            },
            innerWidth:120,wrapText: true
        },

        {label:'Return Quantity',fieldName:'return_quantity', type:'number',editable:{fieldName:'editStatus'}, innerWidth:120, cellAttributes: 
        { class: 'slds-text-color_success slds-text-title_caps slds-color__background_gray-5'}
    },
        {label:'Unit Credit price', fieldName:'Net_Value__c', type:'currency', innerWidth:120, cellAttributes: 
        { class: 'slds-text-color_success slds-text-title_caps slds-color__background_gray-5'}
    },
        {label:'',fieldName:'datadata', type:'getpopup', cellAttributes: 
        { class: 'slds-text-color_success slds-color__background_gray-5'},typeAttributes:{
           
            rowRecordId:{fieldName:'getrowIs'},
            soldTo:{fieldName:'soldToName'},
            shipTo:{fieldName:'shipToName'}
            
        },innerWidth:120},

    ]
    //editable:`${editStatus}`


    @track data = [];
    wiredActivities;
     @track value = '';

    connectedCallback(){
        //console.log(USER_ID);
    }

 // renderedCallback(){ 
        
 //   } 

    myDiv
    checkbox
    renderedCallback(){
        const style = document.createElement('style')
        style.innerText = `.slds-pill_container{
            border:0px;
        }`
        this.template.querySelector('lightning-pill-container').appendChild(style)

        const styling = document.createElement('style')
        styling.innerText = `.comm-content-header{
            background: #f3f3f3;
        }`
        this.template.querySelector('div').appendChild(styling)
    
    if(this.isCssLoaded) return
        this.isCssLoaded = true
        loadStyle(this, COLORS).then(()=>{
            console.log("Loaded Successfully")
        }).catch(error=>{ 
            console.error("Error in loading the colors")
        })
    
    
    
    }



    navHomepage(){
        this.dispSpinner = false;
        //this.showToastmsg('Success', `request submitted case No ${this.caseNo}`)
        this[NavigationMixin.Navigate]({
            type:'comm__namedPage',
            attributes:{
                    name: 'Home',
                //"url": "https://isvcr4cpoc-intelcustomersupport.cs35.force.com/R4CPocPortal/s/"
            }
        });
    }


    // Return Type, Remedy, Return Reason pickLists start

    caseRecordTypes;
    @wire(getObjectInfo, {objectApiName:Case_Object})
    caseObjectInfo({data, error}){
        if(data){
            //console.log(data.recordTypeInfos)
            this.caseRecordTypes = data.recordTypeInfos;
        }
        if(error){
            console.log(error)
        }
    }    

    @track CLIRecordId;
    @wire(getObjectInfo, {objectApiName:CaseLineItem_Object})
    caseLineObjectInfo({data, error}){
        if(data){
            this.CLIRecordId = data.defaultRecordTypeId;
        }
        if(error){
            console.log(error)
        }
    }

    returnTypeOptions =[];
    //remedyoptions;
    @wire(getPicklistValuesByRecordType, {objectApiName:CaseLineItem_Object, recordTypeId:'$CLIRecordId'}) 
    getCaseLineItemobjPicklists({data, error}){
        if(data){
            //console.log(data)
            //this.returnTypeOptions = this.createPicklistdata(data.picklistFieldValues.Return_Type__c)

            this.returnTypeOptions = data.picklistFieldValues.Return_Type__c.values;
            this.remedyValues = data.picklistFieldValues.Remedy__c;
            this.returnReasonField = data.picklistFieldValues.Return_Reason__c;
            console.log(this.returnReasonField)
        }
        if(error){
            console.log(error);
        }
    }

    Custrecordtypeid;
    @track selectedReturnType =null;
    @track remedyOptions;
    handleReturntype(event){
        //console.log(this.label.START_DATE)
        //console.log(this.label.END_DATE)
        this.selectedReturnType = event.detail.value;

        let validStartDate = new Date(this.label.START_DATE);
        let validEndDate = new Date(this.label.END_DATE);
        let today = new Date();
        //console.log(today);
        if ((today.getTime() < validStartDate.getTime() || today.getTime() > validEndDate.getTime()) && this.selectedReturnType == 'Stock Rotation'){
            this.showToastmsg('Alert', 'Stock Rotation is not applicable', 'error')
            this.selectedReturnType = '';
            this.template.querySelectorAll('.rtPicklist').forEach(each => {
                each.value='';
            });
        }
        else{    
            this.Rtvalue =  this.selectedReturnType ;
            //console.log(this.caseRecordTypes);
            let recordTypeInfos = Object.values(this.caseRecordTypes);
            for(let i = 0; i < recordTypeInfos.length; i++){
                if(recordTypeInfos[i].name == this.selectedReturnType){
                    this.Custrecordtypeid = recordTypeInfos[i].recordTypeId;
                }
            }
    
           let key = this.returnReasonField.controllerValues[event.target.value];
           this.returnReasonOptions = this.returnReasonField.values.filter(opt => opt.validFor.includes(key));
    
            if(this.addpills.length >0){
                this.genTableRows();
            }
        }
    }

    @track returnReasonOptions;
    @track selectedReturnReason;
    handleReturnReason(event){
        this.selectedReturnReason = event.detail.value;
        console.log(this.selectedReturnReason)
        let keyForRemedy = this.remedyValues.controllerValues[event.target.value];
        this.remedyOptions = this.remedyValues.values.filter(opt => opt.validFor.includes(keyForRemedy));
        
        if(this.addpills.length >0){
            this.genTableRows();
        }
    }

    @track selectRemedyOptions;
    handleRemedyOptions(event) {
        this.selectRemedyOptions = event.detail.value;
        let key = this.returnReasonField.controllerValues[event.target.value];
        console.log(key +'hello');
        //this.returnReasonOptions = this.returnReasonField.values.filter(opt => opt.validFor.includes(key));
    }


    // Return Type, Remedy, Return Reason pickLists ends


    //Collection Address Start

    @track Options =[];
    setofAddress= [];
    @wire(getCollectionAddress, {userid: USER_ID})
    wiredclass({data, error}){
        if(data){
            //console.log(data);
            const addressVal = data;
            let setOptions = Object.values(addressVal);
            for(let i = 0; i<setOptions.length; i++){
                
                let CollectionAddress = {}
                CollectionAddress.AddressName = setOptions[i].r4c_Street1__c+','+setOptions[i].r4c_Street2__c+','+setOptions[i].r4c_Street3__c+','+setOptions[i].r4c_Street4__c+','+setOptions[i].r4c_State_Province__c+','+setOptions[i].r4c_City__c+','+setOptions[i].Country__c+','+setOptions[i].r4c_Zip_Postal_Code__c,
                CollectionAddress.Id =  setOptions[i].Id,
                
                this.setofAddress.push(CollectionAddress);
            }
            //console.log(this.setofAddress);
            this.Options = this.genSiteAddress(this.setofAddress);
        }
        if(error){
            console.log(error);
        }
    }

    genSiteAddress(data){
        //console.log(data)
        return data.map(item=>({label:item.AddressName, value:item.Id}))
    }

    @track CollectionAddressId;
    handleChange(event) {
        this.CollectionAddressId = event.detail.value;
    }

    //Collection Address end

    //COLLECTION DatePicker Start HERE

    @track selectCollectionDate;
    dispSelectedDate;
    handleCollectionDate(event){
        let convertedDate = new Date(event.detail.value);
        //alert(convertedDate.getDate());
        let today = new Date();
        let validateddate;
        let dd = today.getDate()+2;
        let mm = today.getMonth()+1;
        let y = today.getFullYear();
        validateddate = y + '-'+ mm + '-'+ dd;
        //alert(today);
        //alert(typeof(validateddate));
        if(parseInt(convertedDate.getMonth()+1)< mm){
            alert('Please select date from ' + validateddate);
        }
        else if(parseInt(convertedDate.getMonth()+1)== mm){
            if(parseInt(convertedDate.getDate()) < parseInt(dd)){
                //alert(convertedDate.getDate())
                alert('Please select date from ' + validateddate);
                this.dispSelectedDate = '';
            }
            else if((parseInt(convertedDate.getDate()) >= parseInt(dd)) && (parseInt(convertedDate.getDay()) == 0 || parseInt(convertedDate.getDay())==6)){
                 alert('please select week day');
            } 
            else{
                this.selectCollectionDate = event.detail.value;
            }
        }
        else if(parseInt(convertedDate.getMonth()+1)> mm){
            if((parseInt(convertedDate.getDay()) == 0 || parseInt(convertedDate.getDay())==6)){
                 alert('please select week day');
            }
            else{
             this.selectCollectionDate = event.detail.value;
            } 
        } 
        else{
            this.selectCollectionDate = event.detail.value;
            this.dispSelectedDate = this.selectCollectionDate;
          }
    }
    
    // COLLECTION DatePicker ENDS HERE

    genPOptions(data){
        //console.log(data)
        return data.map(item=>({label:item, value:item}))
    }
    generatePOPills(data){
        //console.log(data);
        return data.map(item=>({label:item, value:item}));
    }   

    @track POoptions=[];
    OPOptions = [];
    @wire(displayPurchaseOrderNumbers,{userid:USER_ID}) Purchaseorders({data, error}){
        if(data){
            console.log(data);
            const purchaseO = data
            let res = Object.values(purchaseO);
            for(let i = 0; i<res.length; i++){
                //console.log(res[i].PO_Number__c)
                if(this.OPOptions.indexOf(res[i].PO_Number__c) == -1){
                    this.OPOptions.push(res[i].PO_Number__c)
                }
            }
            //console.log(this.OPOptions)
            this.POoptions = this.genPOptions(this.OPOptions)

            data.forEach(row=>{
                this.LoginAccount_Name = row.Account_Name__r.Name;
            })
        }
        if(error){
         console.log(error);
        }
    }

    storedPOrecords = [];
    recordCopyId = [];
    @track selectedPOValue = 'null';
    genPillarr = [];
    @track addpills = [];
    inHeight = 200;
    handlePO(event){
        if(this.selectedReturnType == null || this.selectedReturnType == ''){
            this.showToastmsg('Alert', 'Select your returnType', 'error')
            this.template.querySelectorAll('.poBox').forEach(each => {
                each.value='';
            });
        }
        else{
        this.selectedPOValue =event.detail.value;
        console.log(this.selectedPOValue);

        const index = this.OPOptions.indexOf(this.selectedPOValue);
        //console.log(index)

        if (index > -1) {
            this.OPOptions.splice(index, 1);
        }
        //console.log(this.OPOptions)
        this.POoptions = this.genPOptions(this.OPOptions)
        
        this.genPillarr.push(this.selectedPOValue);
        //console.log(this.genPillarr);
        this.addpills = this.generatePOPills(this.genPillarr);
        
        const style = document.createElement('style')
                style.innerText = `.slds-input__icon-group_right .slds-input__icon_right, .slds-input__icon-group_right .slds-input__icon--right                
                {
                    position: revert;
                }`
                this.template.querySelector('lightning-card').appendChild(style)

        console.log(this.addpills.length);
        let incH = this.inHeight;
        for(let z = 0; z < this.addpills.length; z++){
            if(this.addpills.length == 1){
                const style = document.createElement('style')
                style.innerText = `.slds-scrollable_y, .slds-scrollable--y{
                    height: ${this.inHeight}px;
                }`
                this.template.querySelector('lightning-card').appendChild(style)
            }
            if(this.addpills.length > 1){
                let incrementval = incH+(50*(this.addpills.length - 1));
                console.log(incrementval);
                const style = document.createElement('style')
                style.innerText = `.slds-scrollable_y, .slds-scrollable--y{
                    height: ${incrementval}px;
                }`
                this.template.querySelector('lightning-card').appendChild(style)
            }
        }

        this.genTableRows();
        }
    }

    genTableRows(){
        console.log(this.genPillarr);
        getSelectedPurchaseOrders({selectedPurchaseOrders:this.genPillarr})
        .then(result =>{
            console.log(result);
 
            this.recordCopyId = result
            console.log(this.recordCopyId)

            let currentData = [];
            result.forEach(row => {
                let rowData = {};

                rowData.Id = row.Id;
                rowData.PO_Number__c = row.PO_Number__c;
                rowData.SO__c = row.SO__c;
                rowData.PO_Date__c = row.PO_Date__c;
                rowData.Line_Item__c = row.Line_Item__c; 
                rowData.Intel_Product_Name__c = row.Intel_Product_Name__c;
                rowData.Quantity__c = row.Quantity__c;
                rowData.return_quantity = row.Billed_Quantity__c;
                rowData.Billed_Quantity__c = row.Billed_Quantity__c;
                rowData.Net_Value__c = row.Net_Value__c;
                rowData.Customer_Part_Number__c = row.Customer_Part_Number__c;
                rowData.editStatus = false;
                if(row.Return_Location__r){
                    rowData.Return_Location__c = row.Return_Location__c;
                }

                //gen optoins for returnreason
                let cretedReasonOpt = this.returnReasonField.values.map(item=>({label:item.label, value:item.value, validFor:item.validFor, Id:row.Id, optiontype:'return reason'}))
                console.log(cretedReasonOpt)
                let key = this.returnReasonField.controllerValues[this.selectedReturnType];
                this.returnReasonOptions = cretedReasonOpt.filter(opt => opt.validFor.includes(key));
                console.log(this.returnReasonOptions)
                rowData.setReturnReasonOpt = this.returnReasonOptions;
                rowData.Return_Reason = '';

                rowData.setRemedyOpt = this.remedyOptions;
                rowData.LineItem_Remedy = '';
                //rowData.remedyOpt = this.returnTypeOptions;

                rowData.Opp_Code = row.Operation_Code__c;
                rowData.getrowIs = row.Id;
                console.log(this.returnTypeOptions);
                if(row.MMID__r){
                    rowData.MMID__c = row.MMID__r.Name;
                    rowData.MMID_Id = row.MMID__c;
                }
                if(row.Stocking_ID__r){
                    rowData.Stocking_ID__c =row.Stocking_ID__r.Name;
                    rowData.Stocking_Id = row.Stocking_ID__c;
                }
                if(row.Ship_To__r){
                    rowData.Ship_To__c = row.Ship_To__r.Name;
                    rowData.shipToName = row.Ship_To__r.Name
                    rowData.ship_To_Id = row.Ship_To__c;
                }
                if(row.Sold_To__r){
                    rowData.Sold_To__c = row.Sold_To__r.Name;
                    rowData.soldToName = row.Sold_To__r.Name
                    rowData.Sold_To_Id = row.Sold_To__c;
                }
                currentData.push(rowData);
            });
            this.POrecords = currentData;
            console.log(currentData)
            this.storedPOrecords = currentData
            //console.log(this.storedPOrecords);
        })
        .catch(error =>{
            console.log(error);
        })
    }

    genRetunrReason(data){
        console.log(data)
        return data.map(item=>({label:item.label, value:item.value, validFor:item.validFor, Id:'123423'}))
    }

    @track infoText;
    removePillItem(event){
        const index = event.detail.index;        
        let indval = this.addpills[index];
        this.infoText = indval.label;

        this.OPOptions.push(this.infoText);
        this.POoptions = this.genPOptions(this.OPOptions)

        if(index > -1){
            this.addpills.splice(index,1);
            this.genPillarr.splice(index,1);
            this.selectedPOValue = '';
        }

        getSelectedPurchaseOrders({selectedPurchaseOrders:this.genPillarr})
        .then(result =>{
            //console.log(result);
            let currentData = [];
            result.forEach(row => {
                let rowData = {};

                rowData.Id = row.Id;
                rowData.PO_Number__c = row.PO_Number__c;
                rowData.SO__c = row.SO__c;
                rowData.PO_Date__c = row.PO_Date__c;
                rowData.Line_Item__c = row.Line_Item__c; 
                rowData.Intel_Product_Name__c = row.Intel_Product_Name__c;
                rowData.Quantity__c = row.Quantity__c;
                rowData.return_quantity = row.Billed_Quantity__c;
                rowData.Billed_Quantity__c = row.Billed_Quantity__c;
                rowData.Net_Value__c = row.Net_Value__c;
                rowData.Customer_Part_Number__c = row.Customer_Part_Number__c;
                rowData.editStatus = false;

                //gen optoins for returnreason
                let cretedReasonOpt = this.returnReasonField.values.map(item=>({label:item.label, value:item.value, validFor:item.validFor, Id:row.Id, optiontype:'return reason'}))
                console.log(cretedReasonOpt)
                let key = this.returnReasonField.controllerValues[this.selectedReturnType];
                this.returnReasonOptions = cretedReasonOpt.filter(opt => opt.validFor.includes(key));
                console.log(this.returnReasonOptions)
                rowData.setReturnReasonOpt = this.returnReasonOptions;
                rowData.Return_Reason = '';

                rowData.setRemedyOpt = this.remedyOptions;
                rowData.LineItem_Remedy = '';
                //rowData.remedyOpt = this.returnTypeOptions;

                rowData.Opp_Code = row.Operation_Code__c;
                rowData.getrowIs = row.Id;
                console.log(this.returnTypeOptions);
                if(row.MMID__r){
                    rowData.MMID__c = row.MMID__r.Name;
                    rowData.MMID_Id = row.MMID__c;
                }
                if(row.Stocking_ID__r){
                    rowData.Stocking_ID__c =row.Stocking_ID__r.Name;
                    rowData.Stocking_Id = row.Stocking_ID__c;
                }
                if(row.Ship_To__r){
                    rowData.Ship_To__c = row.Ship_To__r.Name;
                    rowData.shipToName = row.Ship_To__r.Name
                    rowData.ship_To_Id = row.Ship_To__c;
                }
                if(row.Sold_To__r){
                    rowData.Sold_To__c = row.Sold_To__r.Name;
                    rowData.soldToName = row.Sold_To__r.Name
                    rowData.Sold_To_Id = row.Sold_To__c;
                }
                currentData.push(rowData);
            });
            this.POrecords = currentData;
        })
        .catch(error =>{
            console.log(error);
        })
        
        this.getpreselectedRow()
    }
    
    recordDataPo = [];
    selectedRowsLenght = null;
    supp = true;
    @track selPOdata=[]

    selectedRecord(event){

        const POselectedobj = this.template.querySelector('.POdataTable').getSelectedRows()
        console.log('selected row details',POselectedobj)
        let lists = [];
        let recordData = [];
        let objval = Object.values(POselectedobj)
        this.selectedRowsLenght = objval.length;
        console.log(objval.length);
        
        if(objval.length != 0){
            this.supp = false;
            this.saveDraftValues = ['disp'];
            //this.saveDraftValues = ['null'];
            //this.finalStepbtn = false;
            //this.showBtn = true;
        }
        if(objval.length == 0){
            //this.finalStepbtn = true;
            this.supp = true;
        }
        for(let i=0; i<objval.length; i++){
            //console.log(objval[i].Id);
            lists.push(objval[i].Id)
            recordData.push(objval[i])
        }
        this.recordDataPo = recordData;
        this.selPOdata = lists;
        console.log('this is selected Id '+this.selPOdata)
        //console.log('this is selected records',this.recordDataPo)
        //this.getpreselectedRow()

        this.enableRowEditable();
    }

    enableRowEditable(){
        
        const tableval = this.POrecords;
        let selectedPOs = Object.values(tableval);

        this.POrecords = '';

        let selectedPORowId = this.selPOdata;
        console.log(selectedPORowId.length);

        for(let i=0; i<selectedPOs.length; i++){
            for(let x=0; x<=selectedPORowId.length; x++){
                if(selectedPOs[i].Id == selectedPORowId[x]){
                    console.log('true')
                    selectedPOs[i].editStatus = true;
                }
                if(selectedPORowId.indexOf(selectedPOs[i].Id) == -1){
                    console.log(' this is not there'+selectedPOs[i].Id)
                    selectedPOs[i].editStatus = false;
                }
            }
        }
        this.POrecords = selectedPOs;
    }

    tablePicklistChanged(event){
        const {selectedPickList} = event.detail;
        const optionval = selectedPickList;
        let loopofOPt = JSON.parse(JSON.stringify(Object.values(optionval)))
        //console.log(loopofOPt) 

        if(loopofOPt[0].optionType == 'return reason'){

            const latestSelectedValue = this.recordDataPo;
            let listPO = Object.values(latestSelectedValue);
            this.recordDataPo = '';
            //console.log(listPO);
            //console.log(editedData)
            if(listPO.length != 0){

                for(let w=0; w<listPO.length; w++){
                    if(listPO[w].Id == loopofOPt[0].Id){
                        console.log('true')
                        listPO[w].Return_Reason = loopofOPt[0].value;

                        let cretedRemedyOpt = this.remedyValues.values.map(item=>({label:item.label, value:item.value, validFor:item.validFor, Id:listPO[w].Id, optiontype:'remedy'}))
                        //console.log(cretedRemedyOpt)
                        let key = this.remedyValues.controllerValues[loopofOPt[0].value];
                        this.remedyOptions = cretedRemedyOpt.filter(opt => opt.validFor.includes(key));
                        //console.log(this.remedyOptions)
                        listPO[w].setRemedyOpt = this.remedyOptions;

                        /*if(this.addpills.length >0){
                            this.genTableRows();
                        }*/
                    }
                }
                this.recordDataPo = listPO;
                
                /*let selectedrowCopy = this.recordDataPo;
                console.log(selectedrowCopy)
                let dataTableRow = JSON.parse(JSON.stringify(Object.values(this.POrecords)));
                console.log(dataTableRow)
                //console.log(dataTableRow)
                for(let u=0; u<dataTableRow.length; u++){
                   if(selectedrowCopy[u].Id.includes(dataTableRow[u].Id)){
                       console.log('it is there '+dataTableRow[u].Id)
                   }
                   else{
                       console.log('not found'+dataTableRow[u])
                   }
                }*/

                //this.POrecords = this.recordDataPo;
                this.selectedRecord()
            }
            else{
                return  this.showToastmsg('Alert', 'Select line item to choose Return reason', 'error')
            }

        }

        if(loopofOPt[0].optionType == 'remedy'){
            const latestSelectedValue = this.recordDataPo;
            let listPO = Object.values(latestSelectedValue);
            this.recordDataPo = '';
            //console.log(listPO);
            //console.log(editedData)
            for(let w=0; w<listPO.length; w++){
                if(listPO[w].Id == loopofOPt[0].Id){
                    console.log('true')
                    listPO[w].LineItem_Remedy = loopofOPt[0].value;
                }
            }
                this.recordDataPo = listPO;
        }

        console.log('this is ',this.recordDataPo)
    }

    @track preSelectedRows=[];
    getpreselectedRow(){
        
        console.log(this.selPOdata)
        const recordvalues = this.selPOdata;
        let recid = Object.values(recordvalues)
        let list = [];
        for(let i=0; i<recid.length; i++){
            list.push(recid[i]);
            //console.log(list);
        }
        this.preSelectedRows = list

    }
    
    @wire(getRecord, { recordId: USER_ID, fields: [CONTACT_ID, ACCOUNT_ID] })
    user;

    caseRecordsFields={}
    caseLineItemFields={}
    @track conid;
    @track accid;

    @track CreatedCaseid;
    listofCaseLineItemtoCreate = [];
    createRmaCaseLineitems(){
        
        const selectedPO = this.recordDataPo;
        console.log(this.recordDataPo);

        let listPO = Object.values(selectedPO);
        for(let i=0; i < listPO.length; i++){

            this.caseLineItemFields={
                //"Name":                 this.subjectValue,
                "Case__c":              this.CreatedCaseid,
                "PO__c":                listPO[i].PO_Number__c,
                "SO__c":                listPO[i].SO__c,
                "PO_Date__c":           listPO[i].PO_Date__c,
                "Ship_To__c":           listPO[i].ship_To_Id,
                "Line_Item__c":         listPO[i].Line_Item__c,
                "Sold_To__c":           listPO[i].Sold_To_Id,
                "Quantity__c":          listPO[i].Quantity__c,
                "Billed_Quantity__c":   listPO[i].Billed_Quantity__c,
                "Return_Quantity__c":   listPO[i].return_quantity,
                "Net_Value__c":         listPO[i].Net_Value__c,
                "Unit_Credit_Price__c": listPO[i].Net_Value__c,
                "Return_Type__c":       this.selectedReturnType,
                "Remedy__c" :           listPO[i].LineItem_Remedy,
                "Return_Reason__c" :    listPO[i].Return_Reason,
                "MMID__c":              listPO[i].MMID_Id,
                "Stocking_ID__c":       listPO[i].Stocking_Id,
                "Operation_Code__c" :   listPO[i].Opp_Code,
                "Customer_Part_Number__c" : listPO[i].Customer_Part_Number__c,
                "Return_Location__c"    :   listPO[i].Return_Location__c
            }
            console.log(this.caseLineItemFields)
            this.listofCaseLineItemtoCreate.push(this.caseLineItemFields);
        }
       
        console.log('completed process');
        this.CreatedCaseid = null;
        console.log(this.listofCaseLineItemtoCreate)
        if(this.listofCaseLineItemtoCreate != null && this.listofCaseLineItemtoCreate !=''){
            createCaseLineItem({lineItems:this.listofCaseLineItemtoCreate}).then(result =>{
                console.log(result)
                return this.navHomepage()
            }).catch(error =>{
                console.log(error);
            })
        }
        else{
            this.showToastmsg('Error Creating Case')
        }
        
    }

    saveDraftValues = [];
    finalStepbtn = true;
    @track values;
    subjectValue;
    @track caseNo;

    handleReturnQuantity(event){
        this.saveDraftValues = []
        this.saveDraftValues = event.detail.draftValues;

        let editedData = Object.values(this.saveDraftValues);  
        //console.log(editedData) 
     
        if(editedData.length != 0){
            const recordInputs = this.saveDraftValues.slice().map(draft => {
                const fields = Object.assign({}, draft);
                //console.log( {fields} );
                return fields;
            });  
            this.values = recordInputs;
            //console.log(this.values);
            
            const latestSelectedValue = this.recordDataPo;
            let listPO = Object.values(latestSelectedValue);
            this.recordDataPo = '';
            //console.log(listPO);
            //console.log(editedData)

            for(let w=0; w<listPO.length; w++){
                for(let v=0; v<editedData.length;v++){
                    if(listPO[w].Id == editedData[v].Id){
                        console.log('true')
                        listPO[w].return_quantity = parseInt(editedData[v].return_quantity);
                    }
                }
            }
            this.recordDataPo = listPO;
            //console.log(this.recordDataPo)
            

            const actualRecData = this.storedPOrecords;
            let getValues = Object.values(actualRecData);

            for(let j=0; j<editedData.length; j++){
                for(let k=0; k<getValues.length; k++){
                    if(editedData[j].Id == getValues[k].Id){
                        
                        if(editedData[j].return_quantity > getValues[k].Quantity__c){
                            const style = document.createElement('style');
                            style.innerText = `.slds-cell-edit{
                                color: red;
                            }`
                            this.template.querySelector('lightning-datatable').appendChild(style);
                            return alert('Return quantity should not be greater than PO quantity');
                        }
                    }
                }
            }
            console.log('if condition satisfied')
            return this.rmaCaseCreation();
        }
        if(editedData.length == 0){
            //alert('Manage your return quantity to submit your request');
            return this.rmaCaseCreation()
        }
        //this.dispSpinner = true;
        //return this.createRmaCaseLineitems();
    }


    rmaCaseCreation(){

        //Case Record Creation

        let sub = this.template.querySelector('.caseSubjt').value
        this.subjectValue = sub;
        let returnPOSub = this.template.querySelector('.case-return-po-sub').value;

        this.conid = getFieldValue(this.user.data, CONTACT_ID);
        this.accid = getFieldValue(this.user.data, ACCOUNT_ID);

        this.caseRecordsFields = {
            "RecordTypeId"          :           this.Custrecordtypeid,
            "Subject"               :           sub,
            "Return_PO__c"          :           returnPOSub,
            "Status"                :           'Open',
            "Priority"              :           'Medium',
            "ContactId"             :           this.conid,
            "AccountId"             :           this.accid,
            "Return_Type__c"        :           this.selectedReturnType,
            "Collection_Date__c"    :           this.selectCollectionDate,
            "Collection_Address__c" :           this.CollectionAddressId,

        }
        console.log(this.caseRecordsFields)

        const caserecordInput = {apiName:Case_Object.objectApiName, fields:this.caseRecordsFields}
        createRecord(caserecordInput).then(result=>{
            this.CreatedCaseid = result.id;
            console.log(this.CreatedCaseid)

            getCaseData({caseid:this.CreatedCaseid})
            .then(caseHandler=>{
                console.log(caseHandler)
                this.caseNo = caseHandler[0].CaseNumber;
                this.caseRecordsFields = {};
                this.showToastmsg('Success', `request submitted case No ${this.caseNo}`)
                return this.createRmaCaseLineitems();

            }).catch(error=>{
                console.log(error)
            })
        }).catch(error=>{
            console.log(error)
            this.showToastmsg('Error Creating record', error.body.message, 'error')
        })

        this.dispSpinner = true;


    }



    removeInlinePopover(){
        
        console.log(this.selectedRowsLenght)
        const styling = document.createElement('style');
            styling.innerText = `.slds-popover{
                width: 200px;
            }`
        this.template.querySelector('.POdataTable').appendChild(styling);

    }
    
    clearSelecteData(){
        this.template.querySelector('.POdataTable').maxRowSelection=[];
    }

    
    showToastmsg(title, message, variant){
        this.dispatchEvent(new ShowToastEvent({
            title,
            message,
            variant: variant || 'success'
        }))
    }
      
}
