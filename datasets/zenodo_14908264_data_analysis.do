* Do-file for data analysis - Sheep dataset - SCC and DSCC 

version 18
clear

*Import the dataset
cd "/Applications/Documents/Mariana/Colaborations/Fernando Nogueira/Sheep project/Data"

use Data_clean.dta




* Descriptives statistics
tab imistatus

twoway (scatter neutrophils lnscc, msize(0.5pt) mcolor(black)) || lowess neutrophils lnscc, legend(off) ytitle("Neutrophils (%)") xtitle("lnSCC") ylabel(, nogrid) xlabel(, nogrid) name(neut_lnscc, replace) title()
graph export "/Applications/Documents/Mariana/Colaborations/Fernando Nogueira/Sheep project/Analysis/Objective 1/Figures/neut_lnscc.tif", width(4488) replace

twoway (scatter linf lnscc, msize(0.5pt) mcolor(black)) || lowess linf lnscc, legend(off) ytitle("Lymphocytes (%)") xtitle("lnSCC") ylabel(, nogrid) xlabel(, nogrid) name(linf_lnscc, replace) title()
graph export "/Applications/Documents/Mariana/Colaborations/Fernando Nogueira/Sheep project/Analysis/Objective 1/Figures/linf_lnscc.tif", width(4488) replace

twoway (scatter macrof lnscc, msize(0.5pt) mcolor(black)) || lowess macrof lnscc, legend(off) ytitle("Macrophages (%)") xtitle("lnSCC") ylabel(, nogrid) xlabel(, nogrid) name(neut_lnscc, replace) title()
graph export "/Applications/Documents/Mariana/Colaborations/Fernando Nogueira/Sheep project/Analysis/Objective 1/Figures/macrof_lnscc.tif", width(4488) replace


********************************************************
*Univariable associations with the outcomes
********************************************************
*********************************************************
* IMI, Parity, Quarter position, and DIM - lnSCC	
*********************************************************	
* IMI
mixed lnscc i.imistatus || sheep:|| quarter:, res(ar 1,t(time)) reml stddev /* P<0.001 */
pwcompare i.imistatus, effects mcompare(bonferroni) groups 

* Parity
mixed lnscc i.parity || sheep:|| quarter:, res(ar 1,t(time)) reml stddev /* P=0.0507 */

margins i.parity
marginsplot

* Quarter
mixed lnscc i.quarter || sheep:|| quarter:, res(ar 1,t(time)) reml stddev /* P=0.3096 */

* DIM
mixed lnscc i.dim_cat || sheep:|| quarter:, res(ar 1,t(time)) reml stddev /* P<0.001 */
pwcompare i.dim, effects mcompare(bonferroni) groups 

margins i.dim_cat
marginsplot

*********************************************************
* IMI, Parity, Quarter position, and DIM - Neutrophils (%)
*********************************************************	
* IMI
mixed neutrophils i.imistatus || sheep:|| quarter:, res(ar 1,t(time)) stddev reml /* P=0.0016 */
pwcompare i.imistatus, effects mcompare(bonferroni) groups

* Parity
mixed neutrophils i.parity || sheep:|| quarter:, res(ar 1,t(time)) stddev reml /* P=0.0640 */

* Quarter
mixed neutrophils i.quarter || sheep:|| quarter:, res(ar 1,t(time)) stddev reml /* P=0.5230 */

* DIM
mixed neutrophils i.dim_cat || sheep:|| quarter:, res(ar 1,t(time)) stddev reml /* P=0.4314 */
pwcompare i.dim, effects mcompare(bonferroni) groups 

*********************************************************
* IMI, Parity, Quarter position, and DIM - Lymphocytes (%)
*********************************************************	
* IMI
mixed linf i.imistatus || sheep:|| quarter:, res(ar 1,t(time)) stddev reml /* P=0.2218 */
pwcompare i.imistatus, effects mcompare(bonferroni) groups

* Parity
mixed linf i.parity || sheep:|| quarter:, res(ar 1,t(time)) stddev reml /* P=0.2414 */

* Quarter
mixed linf i.quarter || sheep:|| quarter:, res(ar 1,t(time)) stddev reml /* P=0.6687 */

* DIM
mixed linf i.dim_cat || sheep:|| quarter:, res(ar 1,t(time)) stddev reml /* P<0.001 */
pwcompare i.dim, effects mcompare(bonferroni) groups 


*********************************************************
* IMI, Parity, Quarter position, and DIM - ln macrofages	
*********************************************************	
* IMI
mixed lnmacrof i.imistatus || sheep:|| quarter:, res(ar 1,t(time)) reml stddev /* P=0.1089 */
pwcompare i.imistatus, effects mcompare(bonferroni) groups 

* Parity
mixed lnmacrof i.parity || sheep:|| quarter:, res(ar 1,t(time)) reml stddev /* P=0.4681 */

margins i.parity
marginsplot

* Quarter
mixed lnmacrof i.quarter || sheep:|| quarter:, res(ar 1,t(time)) reml stddev /* P=0.5185 */

* DIM
mixed lnmacrof i.dim_cat || sheep:|| quarter:, res(ar 1,t(time)) reml stddev /* P<0.001 */
pwcompare i.dim, effects mcompare(bonferroni) groups 

margins i.dim_cat
marginsplot


**********************************************
* Associations between independent variables
**********************************************
* IMI x Quarter position
tab quarter imistatus, chi /* P=0.145 */

* IMI x Parity
tab parity imistatus, chi /* P<0.001 */

* IMI x DIM
tab dim_cat imistatus, chi /* P=0.019 */














********************************************
* Model Building - lnSCC
********************************************
*Interaction IMI x Parity
mixed lnscc i.imistatus##i.parity || sheep:|| quarter:, res(ar 1,t(time)) reml stddev
testparm imistatus#parity /* P=0.2679 */

*Interaction IMI x DIM
mixed lnscc i.imistatus##i.dim_cat || sheep:|| quarter:, res(ar 1,t(time)) reml stddev
testparm imistatus#dim_cat /* P=0.8284 */

*Interaction IMI x Quarter position
mixed lnscc i.imistatus##i.quarter || sheep:|| quarter:, res(ar 1,t(time)) reml stddev
testparm imistatus#quarter /* P=0.3097 */

*Model with variables <0.2
mixed lnscc i.imistatus i.parity i.dim_cat || sheep:|| quarter:, res(ar 1,t(time)) reml stddev
testparm i.imistatus   /* P<0.001 */
testparm i.dim_cat   /* P<0.001 */

****************************************
* FINAL MODEL IMI - lnSCC
****************************************
*Model with variables <0.2
mixed lnscc i.imistatus i.parity ib4.dim_cat || sheep:|| quarter:, res(ar 1,t(time)) reml stddev /* P<0.001 */
pwcompare i.imistatus, effects mcompare(bonferroni) groups

margins i.imistatus
marginsplot, ytitle(lnSCC) xlabel(, angle(45)) title(Predict values for lnSCC) ///
ylabel(, nogrid) xlabel(, nogrid) xlabel(0 "Noninfected" 3 "{it:S. chromogenes}" 1 "Major pathogens" 2 "{it:C. bovis}" 4 "{it:S. simulans}" 5 "{it:S. xylosus}" 6 "Other NASM" 7 "Other status") ///
plotopts(connect(i) mcolor(black)) ciopts(lcolor(lgrey)) title("") xtitle("") xlabel(, labsize(small))
graph export "/Applications/Documents/Mariana/Colaborations/Fernando Nogueira/Sheep project/Analysis/Objective 1/Figures/lnSCC_IMI.tif", width(4488) replace



***************************
* Model Evaluation
***************************
************************************************************************  
* computing residuals, random effects and predicted values
************************************************************************  
	* standardized residuals at lowest level
		* by default these take the random effects into account when computing the fitted value
		predict res_quarter_lowest, rsta
			sum res_quarter_lowest

			
	* random effects (BLUPs) at cow level (and their SEs)
		predict ref_sheep, ref relevel(sheep)
		predict rese_sheep, reses relevel(sheep)
			sum ref_sheep rese_sheep
			
	* random effects (BLUPs) at quarter level (and their SEs)
		predict ref_quarter, ref relevel(quarter)
		predict rese_quarter, reses relevel(quarter)
			sum ref_quarter rese_quarter		
			
	* predicted value - fixed effects only
		predict pv, xb
		bysort sheep: egen  pv_sheep=mean(pv)		/* average pv for cow */
		bysort quarter: egen pv_quarter=mean(pv) /* average pv for quarter */
	* predicted value incorporating random effect
		predict pvre_sheep, fitted relevel(sheep)
		predict pvre_quarter, fitted relevel(quarter)
			sum res_quarter_lowest ref_sheep pv pv_sheep pvre_sheep pv_quarter pvre_quarter, detail

		
					
************************************************************************  
* evaluation of sheep-level residuals
************************************************************************  
	* create a "flag" for selecting one record per cow
		egen f2 = tag(sheep)   /* flag 1 record per cow */
	* caterpillar plot of random effects and SEs vs rank
		preserve
			collapse (mean) ref_sheep rese_sheep , by(sheep)
			sort ref_sheep
			gen rank=_n
			serrbar ref_sheep rese_sheep rank , ylab(#4, angle(horiz)) ///
				mvopts(mlabel(sheep)) yti("RE +/- SE") name(catplr_se, replace)
			* scaling error bars to show CI
			serrbar ref_sheep rese_sheep rank , ylab(#4, angle(horiz)) ///
				mvopts(mlabel(sheep)) scale(1.96) yti("RE (CI)") name(catplr_ci, replace)
		restore
	* normality plot
		qnorm ref_sheep if f2, mlabel(sheep)
	* heteroscedasticity plots
		scatter ref_sheep pv_sheep if f2 , mlabel(sheep) name(re_sheep,replace)
	

************************************************************************  
* evaluation of quarter-level residuals
************************************************************************  
	egen quarter_id=group(sheep quarter)
	* create a "flag" for selecting one record per cow
		egen f3 = tag(quarter_id)   /* flag 1 record per cow */
	* caterpillar plot of random effects and SEs vs rank
		preserve
			collapse (mean) ref_quarter rese_quarter , by(quarter_id)
			sort ref_quarter
			gen rank=_n
			serrbar ref_quarter rese_quarter rank , ylab(#4, angle(horiz)) ///
				mvopts(mlabel(quarter)) yti("RE +/- SE") name(catplr_se, replace)
			* scaling error bars to show CI
			serrbar ref_sheep rese_sheep rank , ylab(#4, angle(horiz)) ///
				mvopts(mlabel(quarter)) scale(1.96) yti("RE (CI)") name(catplr_ci, replace)
		restore
	* normality plot
		qnorm ref_quarter if f3, mlabel(quarter)
	* heteroscedasticity plots
		scatter ref_quarter pv_quarter if f3 , mlabel(quarter) name(re_quarter,replace)
	
	
	
************************************************************************  
* evaluation of quarter level residuals
************************************************************************  
	* normality plot
		qnorm res_quarter_lowest, scheme(s1mono)
	* heteroscedasticity plot
		scatter res_quarter_lowest pv, scheme(s1mono)			/* pv based on fixed effects only */
		scatter res_quarter_lowest pvre_sheep, scheme(s1mono)		/* pv includes RE */





****************************************************************************************************************************************************







********************************************
* Model Building - Neutrophils
********************************************
*Interaction IMI x Parity
mixed neutrophils i.imistatus##i.parity ||sheep:|| quarter:, res(ar 1,t(time)) reml stddev /* P<0.001 */
testparm imistatus#parity /* P=0.2736 */

*Interaction IMI x DIM
mixed neutrophils i.imistatus##i.dim_cat || sheep:|| quarter:, res(ar 1,t(time)) reml stddev /* P<0.001 */
testparm imistatus#i.dim_cat /* P=0.8211 */

*Model with variables <0.2
mixed neutrophils i.imistatus i.parity i.dim_cat || sheep:|| quarter:, res(ar 1,t(time)) reml stddev /* P<0.001 */
testparm i.imistatus   /* P=0.1054 */
testparm i.dim_cat   /* P=0.4208 */
testparm i.parity /* P=0.1883 */

****************************************
* FINAL MODEL IMI - Neutrophils
****************************************
*Model with variables <0.2
mixed neutrophils i.imistatus i.parity || sheep:|| quarter:, res(ar 1,t(time)) reml stddev /* P=0.0004 */
pwcompare i.imistatus, effects mcompare(bonferroni) groups

margins i.imistatus
marginsplot, ytitle(Neutrophils (%)) xlabel(, angle(45)) title(Predict values for Neutrophils (%)) ///
ylabel(, nogrid) xlabel(, nogrid) xlabel(0 "Noninfected" 3 "{it:S. chromogenes}" 1 "Major pathogens" 2 "{it:C. bovis}" 4 "{it:S. simulans}" 5 "{it:S. xylosus}" 6 "Other NASM" 7 "Other status") ///
plotopts(connect(i) mcolor(black)) ciopts(lcolor(lgrey)) title("") xtitle("") xlabel(, labsize(small))
graph export "/Applications/Documents/Mariana/Colaborations/Fernando Nogueira/Sheep project/Analysis/Objective 1/Figures/neut_IMI.tif", width(4488) replace

***************************
* Model Evaluation
***************************
************************************************************************  
* computing residuals, random effects and predicted values
************************************************************************  
	* standardized residuals at lowest level
		* by default these take the random effects into account when computing the fitted value
		predict res_quarter_lowest, rsta
			sum res_quarter_lowest

			
	* random effects (BLUPs) at sheep level (and their SEs)
		predict ref_sheep, ref relevel(sheep)
		predict rese_sheep, reses relevel(sheep)
			sum ref_sheep rese_sheep
			
	* random effects (BLUPs) at quarter level (and their SEs)
		predict ref_quarter, ref relevel(quarter)
		predict rese_quarter, reses relevel(quarter)
			sum ref_quarter rese_quarter		
			
	* predicted value - fixed effects only
		predict pv, xb
		bysort sheep: egen  pv_sheep=mean(pv)		/* average pv for cow */
		bysort quarter: egen pv_quarter=mean(pv) /* average pv for quarter */
	* predicted value incorporating random effect
		predict pvre_sheep, fitted relevel(sheep)
		predict pvre_quarter, fitted relevel(quarter)
			sum res_quarter_lowest ref_sheep pv pv_sheep pvre_sheep pv_quarter pvre_quarter, detail

		
					
************************************************************************  
* evaluation of sheep-level residuals
************************************************************************  
	* create a "flag" for selecting one record per cow
		egen f2 = tag(sheep)   /* flag 1 record per cow */
	* caterpillar plot of random effects and SEs vs rank
		preserve
			collapse (mean) ref_sheep rese_sheep , by(sheep)
			sort ref_sheep
			gen rank=_n
			serrbar ref_sheep rese_sheep rank , ylab(#4, angle(horiz)) ///
				mvopts(mlabel(sheep)) yti("RE +/- SE") name(catplr_se, replace)
			* scaling error bars to show CI
			serrbar ref_sheep rese_sheep rank , ylab(#4, angle(horiz)) ///
				mvopts(mlabel(sheep)) scale(1.96) yti("RE (CI)") name(catplr_ci, replace)
		restore
	* normality plot
		qnorm ref_sheep if f2, mlabel(sheep)
	* heteroscedasticity plots
		scatter ref_sheep pv_sheep if f2 , mlabel(sheep) name(re_sheep,replace)
	

************************************************************************  
* evaluation of quarter-level residuals
************************************************************************  
	egen quarter_id=group(sheep quarter)
	* create a "flag" for selecting one record per cow
		egen f3 = tag(quarter_id)   /* flag 1 record per cow */
	* caterpillar plot of random effects and SEs vs rank
		preserve
			collapse (mean) ref_quarter rese_quarter , by(quarter_id)
			sort ref_quarter
			gen rank1=_n
			serrbar ref_quarter rese_quarter rank1 , ylab(#4, angle(horiz)) ///
				mvopts(mlabel(quarter)) yti("RE +/- SE") name(catplr_se, replace)
			* scaling error bars to show CI
			serrbar ref_sheep rese_sheep rank1 , ylab(#4, angle(horiz)) ///
				mvopts(mlabel(quarter)) scale(1.96) yti("RE (CI)") name(catplr_ci, replace)
		restore
	* normality plot
		qnorm ref_quarter if f3, mlabel(quarter)
	* heteroscedasticity plots
		scatter ref_quarter pv_quarter if f3 , mlabel(quarter) name(re_quarter,replace)
	
	
	
************************************************************************  
* evaluation of quarter level residuals
************************************************************************  
	* normality plot
		qnorm res_quarter_lowest, scheme(s1mono)
	* heteroscedasticity plot
		scatter res_quarter_lowest pv, scheme(s1mono)			/* pv based on fixed effects only */
		scatter res_quarter_lowest pvre_sheep, scheme(s1mono)		/* pv includes RE */



		
****************************************************************************************************************************************************
		

********************************************
* Model Building - Lymphocytes
********************************************
*Interaction IMI x Parity
mixed linf i.imistatus##i.parity || sheep:|| quarter:, res(ar 1,t(time)) reml /* P=0.3296 */
testparm imistatus#parity /* P=0.6082 */

*Interaction IMI x DIM
mixed linf i.imistatus##i.dim_cat || sheep:|| quarter:, res(ar 1,t(time)) reml /* P<0.001 */
testparm imistatus#dim_cat /* P=0.2638 */

*Model with variables <0.2
mixed linf i.imistatus i.parity i.dim_cat || sheep:|| quarter:, res(ar 1,t(time)) reml /* P<0.001 */
testparm i.imistatus   /* P=0.1270 */
testparm i.dim_cat   /* P<0.001 */

****************************************
* FINAL MODEL IMI - Lymphocytes
****************************************
*Model with variables <0.2
mixed linf i.imistatus ib4.dim_cat || sheep:|| quarter:, res(ar 1,t(time)) reml stddev /* P=0.0004 */
pwcompare i.imistatus, effects mcompare(bonferroni) groups

margins i.imistatus
marginsplot, ytitle(Lymphocytes (%)) xlabel(, angle(45)) title(Predict values for Lymphocytes (%)) ///
ylabel(, nogrid) xlabel(, nogrid) xlabel(0 "Noninfected" 3 "{it:S. chromogenes}" 1 "Major pathogens" 2 "{it:C. bovis}" 4 "{it:S. simulans}" 5 "{it:S. xylosus}" 6 "Other NASM" 7 "Other status") ///
plotopts(connect(i) mcolor(black)) ciopts(lcolor(lgrey)) title("") xtitle("") xlabel(, labsize(small))
graph export "/Applications/Documents/Mariana/Colaborations/Fernando Nogueira/Sheep project/Analysis/Objective 1/Figures/linf_IMI.tif", width(4488) replace

***************************
* Model Evaluation
***************************
************************************************************************  
* computing residuals, random effects and predicted values
************************************************************************  
	* standardized residuals at lowest level
		* by default these take the random effects into account when computing the fitted value
		predict res_quarter_lowest, rsta
			sum res_quarter_lowest

			
	* random effects (BLUPs) at cow level (and their SEs)
		predict ref_sheep, ref relevel(sheep)
		predict rese_sheep, reses relevel(sheep)
			sum ref_sheep rese_sheep
			
	* random effects (BLUPs) at quarter level (and their SEs)
		predict ref_quarter, ref relevel(quarter)
		predict rese_quarter, reses relevel(quarter)
			sum ref_quarter rese_quarter		
			
	* predicted value - fixed effects only
		predict pv, xb
		bysort sheep: egen  pv_sheep=mean(pv)		/* average pv for cow */
		bysort quarter: egen pv_quarter=mean(pv) /* average pv for quarter */
	* predicted value incorporating random effect
		predict pvre_sheep, fitted relevel(sheep)
		predict pvre_quarter, fitted relevel(quarter)
			sum res_quarter_lowest ref_sheep pv pv_sheep pvre_sheep pv_quarter pvre_quarter, detail

		
					
************************************************************************  
* evaluation of sheep-level residuals
************************************************************************  
	* create a "flag" for selecting one record per cow
		egen f2 = tag(sheep)   /* flag 1 record per cow */
	* caterpillar plot of random effects and SEs vs rank
		preserve
			collapse (mean) ref_sheep rese_sheep , by(sheep)
			sort ref_sheep
			gen rank=_n
			serrbar ref_sheep rese_sheep rank , ylab(#4, angle(horiz)) ///
				mvopts(mlabel(sheep)) yti("RE +/- SE") name(catplr_se, replace)
			* scaling error bars to show CI
			serrbar ref_sheep rese_sheep rank , ylab(#4, angle(horiz)) ///
				mvopts(mlabel(sheep)) scale(1.96) yti("RE (CI)") name(catplr_ci, replace)
		restore
	* normality plot
		qnorm ref_sheep if f2, mlabel(sheep)
	* heteroscedasticity plots
		scatter ref_sheep pv_sheep if f2 , mlabel(sheep) name(re_sheep,replace)
	

************************************************************************  
* evaluation of quarter-level residuals
************************************************************************  
	egen quarter_id=group(sheep quarter)
	* create a "flag" for selecting one record per cow
		egen f3 = tag(quarter_id)   /* flag 1 record per cow */
	* caterpillar plot of random effects and SEs vs rank
		preserve
			collapse (mean) ref_quarter rese_quarter , by(quarter_id)
			sort ref_quarter
			gen rank=_n
			serrbar ref_quarter rese_quarter rank , ylab(#4, angle(horiz)) ///
				mvopts(mlabel(quarter)) yti("RE +/- SE") name(catplr_se, replace)
			* scaling error bars to show CI
			serrbar ref_sheep rese_sheep rank , ylab(#4, angle(horiz)) ///
				mvopts(mlabel(quarter)) scale(1.96) yti("RE (CI)") name(catplr_ci, replace)
		restore
	* normality plot
		qnorm ref_quarter if f3, mlabel(quarter)
	* heteroscedasticity plots
		scatter ref_quarter pv_quarter if f3 , mlabel(quarter) name(re_quarter,replace)
	
	
	
************************************************************************  
* evaluation of quarter level residuals
************************************************************************  
	* normality plot
		qnorm res_quarter_lowest, scheme(s1mono)
	* heteroscedasticity plot
		scatter res_quarter_lowest pv, scheme(s1mono)			/* pv based on fixed effects only */
		scatter res_quarter_lowest pvre_sheep, scheme(s1mono)		/* pv includes RE */


		
**************************************************************************************************************************************************		
		
		
		
********************************************
* Model Building - ln macrophages
********************************************
*Interaction IMI x Parity
mixed lnmacrof i.imistatus##i.parity || sheep:|| quarter:, res(ar 1,t(time)) reml stddev
testparm imistatus#parity /* P=0.2874 */

*Interaction IMI x DIM
mixed lnmacrof i.imistatus##i.dim_cat || sheep:|| quarter:, res(ar 1,t(time)) reml stddev
testparm imistatus#dim_cat /* P=0.9597 */

*Interaction IMI x Quarter position
mixed lnmacrof i.imistatus##i.quarter || sheep:|| quarter:, res(ar 1,t(time)) reml stddev
testparm imistatus#quarter /* P=0.6863 */

*Model with variables <0.2
mixed lnmacrof i.imistatus i.parity i.dim_cat || sheep:|| quarter:, res(ar 1,t(time)) reml stddev /* Parity not sig P=0.608 */
testparm i.imistatus   /* P=0.0717 */
testparm i.dim_cat   /* P<0.001 */


****************************************
* FINAL MODEL IMI - ln macrophages
****************************************
*Model with variables <0.2
mixed lnmacrof i.imistatus ib4.dim_cat || sheep:|| quarter:, res(ar 1,t(time)) reml stddev /* P<0.001 */
testparm i.imistatus
testparm i.dim_cat
pwcompare i.imistatus, effects mcompare(bonferroni) groups

pwcompare i.dim_cat, effects mcompare(bonferroni) groups

margins i.imistatus
marginsplot, ytitle(lnMacrophages) xlabel(, angle(45)) title(Predict values for lnmacrof) ///
ylabel(, nogrid) xlabel(, nogrid) xlabel(0 "Noninfected" 3 "{it:S. chromogenes}" 1 "Major pathogens" 2 "{it:C. bovis}" 4 "{it:S. simulans}" 5 "{it:S. xylosus}" 6 "Other NASM" 7 "Other status") ///
plotopts(connect(i) mcolor(black)) ciopts(lcolor(lgrey)) title("") xtitle("") xlabel(, labsize(small))
graph export "/Applications/Documents/Mariana/Colaborations/Fernando Nogueira/Sheep project/Analysis/Objective 1/Figures/lnmacrof_IMI.tif", width(4488) replace



***************************
* Model Evaluation
***************************
************************************************************************  
* computing residuals, random effects and predicted values
************************************************************************  
	* standardized residuals at lowest level
		* by default these take the random effects into account when computing the fitted value
		predict res_quarter_lowest, rsta
			sum res_quarter_lowest

			
	* random effects (BLUPs) at cow level (and their SEs)
		predict ref_sheep, ref relevel(sheep)
		predict rese_sheep, reses relevel(sheep)
			sum ref_sheep rese_sheep
			
	* random effects (BLUPs) at quarter level (and their SEs)
		predict ref_quarter, ref relevel(quarter)
		predict rese_quarter, reses relevel(quarter)
			sum ref_quarter rese_quarter		
			
	* predicted value - fixed effects only
		predict pv, xb
		bysort sheep: egen  pv_sheep=mean(pv)		/* average pv for cow */
		bysort quarter: egen pv_quarter=mean(pv) /* average pv for quarter */
	* predicted value incorporating random effect
		predict pvre_sheep, fitted relevel(sheep)
		predict pvre_quarter, fitted relevel(quarter)
			sum res_quarter_lowest ref_sheep pv pv_sheep pvre_sheep pv_quarter pvre_quarter, detail

		
					
************************************************************************  
* evaluation of sheep-level residuals
************************************************************************  
	* create a "flag" for selecting one record per cow
		egen f2 = tag(sheep)   /* flag 1 record per cow */
	* caterpillar plot of random effects and SEs vs rank
		preserve
			collapse (mean) ref_sheep rese_sheep , by(sheep)
			sort ref_sheep
			gen rank=_n
			serrbar ref_sheep rese_sheep rank , ylab(#4, angle(horiz)) ///
				mvopts(mlabel(sheep)) yti("RE +/- SE") name(catplr_se, replace)
			* scaling error bars to show CI
			serrbar ref_sheep rese_sheep rank , ylab(#4, angle(horiz)) ///
				mvopts(mlabel(sheep)) scale(1.96) yti("RE (CI)") name(catplr_ci, replace)
		restore
	* normality plot
		qnorm ref_sheep if f2, mlabel(sheep)
	* heteroscedasticity plots
		scatter ref_sheep pv_sheep if f2 , mlabel(sheep) name(re_sheep,replace)
	

************************************************************************  
* evaluation of quarter-level residuals
************************************************************************  
	egen quarter_id=group(sheep quarter)
	* create a "flag" for selecting one record per cow
		egen f3 = tag(quarter_id)   /* flag 1 record per cow */
	* caterpillar plot of random effects and SEs vs rank
		preserve
			collapse (mean) ref_quarter rese_quarter , by(quarter_id)
			sort ref_quarter
			gen rank1=_n
			serrbar ref_quarter rese_quarter rank1 , ylab(#4, angle(horiz)) ///
				mvopts(mlabel(quarter)) yti("RE +/- SE") name(catplr_se, replace)
			* scaling error bars to show CI
			serrbar ref_sheep rese_sheep rank1 , ylab(#4, angle(horiz)) ///
				mvopts(mlabel(quarter)) scale(1.96) yti("RE (CI)") name(catplr_ci, replace)
		restore
	* normality plot
		qnorm ref_quarter if f3, mlabel(quarter)
	* heteroscedasticity plots
		scatter ref_quarter pv_quarter if f3 , mlabel(quarter) name(re_quarter,replace)
	
	
	
************************************************************************  
* evaluation of quarter level residuals
************************************************************************  
	* normality plot
		qnorm res_quarter_lowest, scheme(s1mono)
	* heteroscedasticity plot
		scatter res_quarter_lowest pv, scheme(s1mono)			/* pv based on fixed effects only */
		scatter res_quarter_lowest pvre_sheep, scheme(s1mono)		/* pv includes RE */





****************************************************************************************************************************************************

***************************
**DESCRIPTIVES STATISTICS	
***************************	


* IMI

sum lnmacrof if imistatus==0, d /*No growth */
sum lnmacrof if imistatus==1, d /*Major*/
sum lnmacrof if imistatus==2, d /*Corynebacterium bovis*/
sum lnmacrof if imistatus==3, d /*Staphylococcus chromogenes*/
sum lnmacrof if imistatus==4, d /*Staphylococcus simulans*/
sum lnmacrof if imistatus==5, d /*Staphylococcus xylosus*/
sum lnmacrof if imistatus==6, d /*Other NASM*/
sum lnmacrof if imistatus==7, d /*Other status*/

sum lnscc if imistatus==0, d /*No growth */
sum lnscc if imistatus==1, d /*Major*/
sum lnscc if imistatus==2, d /*Corynebacterium bovis*/
sum lnscc if imistatus==3, d /*Staphylococcus chromogenes*/
sum lnscc if imistatus==4, d /*Staphylococcus simulans*/
sum lnscc if imistatus==5, d /*Staphylococcus xylosus*/
sum lnscc if imistatus==6, d /*Other NASM*/
sum lnscc if imistatus==7, d /*Other status*/

sum neutrophils if imistatus==0, d /*No growth */
sum neutrophils if imistatus==1, d /*Major*/
sum neutrophils if imistatus==2, d /*Corynebacterium bovis*/
sum neutrophils if imistatus==3, d /*Staphylococcus chromogenes*/
sum neutrophils if imistatus==4, d /*Staphylococcus simulans*/
sum neutrophils if imistatus==5, d /*Staphylococcus xylosus*/
sum neutrophils if imistatus==6, d /*Other NASM*/
sum neutrophils if imistatus==7, d /*Other status*/

sum linf if imistatus==0, d /*No growth */
sum linf if imistatus==1, d /*Major*/
sum linf if imistatus==2, d /*Corynebacterium bovis*/
sum linf if imistatus==3, d /*Staphylococcus chromogenes*/
sum linf if imistatus==4, d /*Staphylococcus simulans*/
sum linf if imistatus==5, d /*Staphylococcus xylosus*/
sum linf if imistatus==6, d /*Other NASM*/
sum linf if imistatus==7, d /*Other status*/


* Parity

sum lnmacrof if parity==0, d /*First lactation */
sum lnmacrof if parity==1, d /* Multiparous*/


sum lnscc if parity==0, d /*First lactation */
sum lnscc if parity==1, d /* Multiparous*/

sum neutrophils if parity==0, d /*First lactation */
sum neutrophils if parity==1, d /* Multiparous*/


sum linf if parity==0, d /*First lactation */
sum linf if parity==1, d /* Multiparous*/

* Half udder postition

sum lnmacrof if quarter==1, d /*Right */
sum lnmacrof if quarter==2, d /*Left*/

sum lnscc if quarter==1, d /*Right */
sum lnscc if quarter==2, d /*Left*/

sum neutrophils if quarter==1, d /*Right */
sum neutrophils if quarter==2, d /*Left*/

sum linf if quarter==1, d /*Right */
sum linf if quarter==2, d /*Left*/

* DIM

sum lnmacrof if dim_cat==1, d /*1 to 3 DIM */
sum lnmacrof if dim_cat==2, d /*7 DIM*/
sum lnmacrof if dim_cat==3, d /*15 DIM*/
sum lnmacrof if dim_cat==4, d /*30 DIM*/


sum lnSCC if dim_cat==1, d /*1 to 3 DIM */
sum lnSCC if dim_cat==2, d /*7 DIM*/
sum lnscc if dim_cat==3, d /*15 DIM*/
sum lnscc if dim_cat==4, d /*30 DIM*/


sum neutrophils if dim_cat==1, d /*1 to 3 DIM */
sum neutrophils if dim_cat==2, d /*7 DIM*/
sum neutrophils if dim_cat==3, d /*15 DIM*/
sum neutrophils if dim_cat==4, d /*30 DIM*/


sum linf if dim_cat==1, d /*1 to 3 DIM */
sum linf if dim_cat==2, d /*7 DIM*/
sum linf if dim_cat==3, d /*15 DIM*/
sum linf if dim_cat==4, d /*30 DIM*/
