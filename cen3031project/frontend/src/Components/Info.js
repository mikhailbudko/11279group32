import React from 'react'
import {Line} from 'react-chartjs-2'
export default class Info extends React.Component {
	constructor(props){
		super(props);
		this.state = {
			address: this.props.address,
			dni: "",
			ghi: "",
			util_comp: "",
			util_rate_com: 0,
			util_rate_ind: 0,
			util_rate_res:0,
			isLoaded: false,
			notFound: false,
			isError: false,
			ac_monthly: [],
			ac_annual: 0,
			
			//For testing
			test: "",
			counter: 0,
		}
	}
	
	getApiInfo(address) {
		//Stops function when nothing is inputted
		if(address === ""){
			return;
		}
		
		//API URLs
		const api_key = 'api_key=hbWbn4H2aZ8jE99uBd5khfbHxqbF09JKwcXA7ayH&';
		const solarRad_url = 'https://developer.nrel.gov/api/solar/solar_resource/v1.json?' + api_key + "&address=" + address;
		//const solarSat_url = 'https://developer.nrel.gov/api/solar/solar_resource/v1.json?'+ api_key + "&address=" + address;
		const util_url = 'https://developer.nrel.gov/api/utility_rates/v3.json?' + api_key + "address=" + address;
		const pvwatts_url = 'https://developer.nrel.gov/api/pvwatts/v6.json?' + api_key + "address=" + address + "&system_capacity=4&azimuth=180&tilt=40&array_type=1&module_type=1&losses=10";
		
		//Fetch data from APIs
		//Solar Radiation
		fetch(solarRad_url)
			.then((response) => response.json())
			.then((data) => {
				const output = data.outputs;
				try {
					this.setState({
						dni: output.avg_dni.annual,
						ghi: output.avg_ghi.annual,
						
						isLoaded:true,
					});
				} catch (e) {
					this.setState({isLoaded: false,isError:true,});
				}
			});
			
		//Solar Panel
		fetch(pvwatts_url)
			.then((response) => response.json())
			.then((data) => {
				try{
					const output = data.outputs;
					this.setState({
						ac_annual: output.ac_annual.toFixed(2),
						ac_monthly: ((output.ac_annual)/12).toFixed(2),
					});
				}catch (e) {
					this.setState({isLoaded: false, isError:true,});
				}
			});
		
		//Utility Rates
		fetch(util_url)
			.then((response) => response.json())
			.then((data) => {
				
				const output = data.outputs;
				this.setState({
					//test: JSON.stringify(data),
					util_comp: output.utility_name,
					util_rate_com: output.commercial,
					util_rate_ind: output.industrial,
					util_rate_res: output.residential,
					
			});
		});
		
		
	}
	
	//Runs function when component rendered
	componentDidMount() {
		this.getApiInfo(this.props.address);
	}

	//Figures based on 893 kWh/month with a 4kW solar system
	getResCost(years, isSolar) {
		let kWhs = 10715;
		let costList = [];
		if (isSolar) {
			kWhs -= this.state.ac_annual;
		}
		let cost = kWhs*this.state.util_rate_res;
		let tempCost = cost;
		if (isSolar)
			cost += 7184;
		for (let i = 0; i <= years; i++) {
			costList.push(cost)
			tempCost *= 1.022;
			cost += tempCost;
		}
		return costList;
	}

	//Figures based on 5692 kWh/month with a 25kW solar system
	getComCost(years, isSolar) {
		let kWhs = 68300;
		let costList = [];
		if (isSolar) {
			kWhs -= this.state.ac_annual*6.25;
		}
		let cost = kWhs*this.state.util_rate_com;
		let tempCost = cost;
		if (isSolar)
			cost += 44900;
		for (let i = 0; i <= years; i++) {
			costList.push(cost)
			tempCost *= 1.022;
			cost += tempCost;
		}
		return costList;
	}

	//Figures based on 68300 kWh/month with a 200kW solar system
	getIndCost(years, isSolar) {
		let kWhs = 966500;
		let costList = [];
		if (isSolar) {
			kWhs -= this.state.ac_annual*50;
		}
		let cost = kWhs*this.state.util_rate_ind;
		let tempCost = cost;
		if (isSolar)
			cost += 359200;
		for (let i = 0; i <= years; i++) {
			costList.push(cost)
			tempCost *= 1.022;
			cost += tempCost;
		}
		return costList;
	}

	getSavings(solar, util) {
		let savingsList = [];
		for (let i = 0; i < solar.length; i++) {
			if (util[i] - solar[i] < 0)
				savingsList.push(0)
			else
				savingsList.push(util[i] - solar[i])
		}
		return savingsList
	}
	
	render() {
		//Display message at start before query
		if(!this.state.isLoaded){
			return <div> Input Address Above!<br/><br/></div>;
		}else if(this.state.isError){
			return <div> Error: Address not found.<br/>
			Only addresses within the US are available.<br/>
			Try a different address!<br/><br/>
				</div>
		}
		else{
			const dataChartRes = {
				labels: ['2021','2022','2023','2024','2025','2026','2027','2028','2029','2030', '2031', '2032', '2033', '2034', '2035'],
				datasets: [
					{label: 'Cumulative Residential Utility Cost',
					borderColor: 'rgb(255, 255, 255)',
					pointBackgroundColor: 'rgb(255, 0, 0)',
					data: this.getResCost(15, false) },
					{label: 'Cumulative Residential Solar Cost',
						borderColor: 'rgb(255, 255, 0)',
						pointBackgroundColor: 'rgb(255, 0, 0)',
						data: this.getResCost(15, true) },
					{label: 'Residential Savings',
						borderColor: 'rgb(255, 0, 0)',
						pointBackgroundColor: 'rgb(0, 0, 0)',
						data: this.getSavings(this.getResCost(15, true), this.getResCost(15, false)) }
				]
			}
			const dataChartCom = {
				labels: ['2021','2022','2023','2024','2025','2026','2027','2028','2029','2030', '2031', '2032', '2033', '2034', '2035'],
				datasets: [
					{label: 'Cumulative Commercial Utility Cost',
						borderColor: 'rgb(0, 255, 255)',
						pointBackgroundColor: 'rgb(255, 0, 0)',
						data: this.getComCost(15, false) },
					{label: 'Cumulative Commercial Solar Cost',
						borderColor: 'rgb(0, 100, 255)',
						pointBackgroundColor: 'rgb(255, 0, 0)',
						data: this.getComCost(15, true) },
					{label: 'Commercial Savings',
						borderColor: 'rgb(255, 0, 0)',
						pointBackgroundColor: 'rgb(0, 0, 0)',
						data: this.getSavings(this.getComCost(15, true), this.getComCost(15, false)) }
				]
			}
			const dataChartInd = {
				labels: ['2021','2022','2023','2024','2025','2026','2027','2028','2029','2030', '2031', '2032', '2033', '2034', '2035'],
				datasets: [
					{label: 'Cumulative Industrial Utility Cost',
						borderColor: 'rgb(255, 0, 255)',
						pointBackgroundColor: 'rgb(255, 0, 0)',
						data: this.getIndCost(15, false)},
					{label: 'Cumulative Industrial Solar Cost',
						borderColor: 'rgb(0, 255, 0)',
						pointBackgroundColor: 'rgb(255, 0, 0)',
						data: this.getIndCost(15, true) },
					{label: 'Industrial Savings',
						borderColor: 'rgb(255, 0, 0)',
						pointBackgroundColor: 'rgb(0, 0, 0)',
						data: this.getSavings(this.getIndCost(15, true), this.getIndCost(15, false)) }
				]
			}
			return (
				//Display info from APIs
				<div key={this.props.address} >
				<h2> {this.props.address} </h2><br/>
{/*				<h3>Solar Radiation Stats</h3><br/>
				Average Daily Direct Normal Irradiance: {this.state.dni} kWh/m<sup>2</sup>/day <br/>
				Average Daily Global Horizontal Irradiance: {this.state.ghi} kWh/m<sup>2</sup>/day<br/><br/>
				
				<h3>Solar Power Output</h3><br/>
				<u>Average Output for 4 kW Capacity System</u><br/>
				AC Monthly Output: {this.state.ac_monthly} kWh<br/>
				AC Annual Output: {this.state.ac_annual} kWh<br/><br/>
				
				<h3>Utility Info</h3><br/>
				Utility Company: {this.state.util_comp} <br/>
				<u>Utility Rates</u> <br/>
				Commerical: {this.state.util_rate_com} $/kWh<br/>
				Industrial: {this.state.util_rate_ind} $/kWh<br/>
				Residential: {this.state.util_rate_res} $/kWh<br/><br/>

				<h3>Average Utility Costs</h3><br/>
				<u>Residential figures based on 893 kWh/month average</u><br/>
				Average Monthly Cost (Residential): ${parseFloat((this.state.util_rate_res)*893).toFixed(2)} <br/>
				Average Annual Cost (Residential): ${parseFloat((this.state.util_rate_res)*10715).toFixed(2)} <br/><br/>*/}

				<Line data={dataChartRes}></Line>
				<Line data={dataChartCom}></Line>
				<Line data={dataChartInd}></Line>
				</div>
				
			);
		}
	}
}
